import fs from "node:fs";
import path from "node:path";
import { type BrowserWindow, app } from "electron";
import type { ThemeManifest } from "../@types/themeManifest.js";
import { mainWindows } from "../discord/window.js";
import { getConfig } from "./config.js";

// Performance optimization: Cache theme manifests to avoid reading on every calll
const themeManifestCache = new Map<string, { manifest: ThemeManifest; mtime: number }>();
let quickCssWatcher: fs.FSWatcher | null = null;

const userDataPath = app.getPath("userData");
const themesFolder = path.join(userDataPath, "/themes/");
function parseBDManifest(content: string) {
    const metaReg = /@([^ ]*) (.*)/g;
    if (!content.startsWith("/**")) {
        throw new Error("Not a manifest.");
    }
    const manifest: ThemeManifest = {
        theme: "src.css",
        name: "null",
        enabled: false,
    }; // Will be defined later

    let match: RegExpExecArray | null;
    for (;;) {
        match = metaReg.exec(content);
        if (match === null) break;
        const [, key, value] = match;
        if (key === "import") break;

        console.log(key, value);

        switch (key) {
            case "name":
                manifest.name = value;
                break;

            case "description":
                manifest.description = value;
                break;

            case "version":
                manifest.version = value;
                break;

            case "author":
                manifest.author = value;
                break;

            case "invite":
                manifest.invite = value;
                break;

            case "authorId":
                manifest.authorId = value;
                break;

            case "authorLink":
                manifest.authorLink = value;
                break;

            case "updateUrl":
                manifest.updateSrc = value;
                break;

            case "donate":
                manifest.donate = value;
                break;

            case "patreon":
                manifest.patreon = value;
                break;

            case "website":
                manifest.website = value;
                break;

            case "source":
                manifest.source = value;
                break;
        }
    }

    return manifest;
}
// Performance optimization: Get theme manifest with caching
function getThemeManifest(themeId: string): ThemeManifest | null {
    const themePath = path.join(themesFolder, themeId);
    const manifestPath = path.join(themePath, "manifest.json");

    if (!fs.existsSync(manifestPath)) {
        return null;
    }

    // Check cache
    const stats = fs.statSync(manifestPath);
    const cached = themeManifestCache.get(themeId);
    if (cached && cached.mtime === stats.mtimeMs) {
        return cached.manifest;
    }

    // Read and cache
    try {
        const manifestContent = fs.readFileSync(manifestPath, "utf8");
        const manifest = JSON.parse(manifestContent) as ThemeManifest;
        themeManifestCache.set(themeId, { manifest, mtime: stats.mtimeMs });
        return manifest;
    } catch (err) {
        console.error(`Error reading theme manifest for ${themeId}:`, err);
        return null;
    }
}

export function injectThemesMain(browserWindow: BrowserWindow): void {
    if (process.argv.includes("--safe-mode")) return;
    if (!fs.existsSync(themesFolder)) {
        fs.mkdirSync(themesFolder);
        console.log("Created missing theme folder");
    }
    browserWindow.webContents.on("did-finish-load", () => {
        if (getConfig("quickCss")) initQuickCss(browserWindow); // load quick CSS if enabled
        const files = fs.readdirSync(themesFolder);
        for (const file of files) {
            const themePath = path.join(themesFolder, file);
            if (fs.statSync(themePath).isFile() && file.endsWith(".DS_Store")) {
                console.log(`[Theme Manager] Local theme detected: ${themePath}`);
                installTheme(themePath).then(() => {
                    fs.unlinkSync(themePath);
                });
            } else {
                try {
                    const themeFile = getThemeManifest(file);
                    if (!themeFile) continue;

                    if (themeFile.enabled === undefined) {
                        const disabledPath = `${userDataPath}/disabled.txt`;
                        if (fs.existsSync(disabledPath) && fs.readFileSync(disabledPath).toString().includes(file)) {
                            themeFile.enabled = false;
                        } else {
                            themeFile.enabled = true;
                        }
                    }
                    if (themeFile.enabled === false) {
                        console.log(`%cSkipped ${themeFile.name} made by ${themeFile.author}`, "color:red");
                    } else {
                        browserWindow.webContents.send(
                            "addTheme",
                            file,
                            fs.readFileSync(`${themePath}/${themeFile.theme}`, "utf-8"),
                        );
                        console.log(`%cLoaded ${themeFile.name} made by ${themeFile.author}`, "color:red");
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        }
    });
}

export function uninstallTheme(id: string) {
    const themePath = path.join(themesFolder, id);
    if (fs.existsSync(themePath)) {
        fs.rmdirSync(themePath, { recursive: true });
        console.log(`Removed ${id} folder`);
    } else if (fs.existsSync(path.join(themesFolder, `${id}-BD`))) {
        fs.rmdirSync(path.join(themesFolder, `${id}-BD`), { recursive: true });
        console.log(`Removed ${id} folder`);
    }
}

export function setThemeEnabled(id: string, enabled: boolean) {
    // Performance optimization: Use cached manifest if available
    let manifest = getThemeManifest(id);
    if (!manifest) {
        manifest = JSON.parse(fs.readFileSync(path.join(themesFolder, id, "/manifest.json"), "utf8")) as ThemeManifest;
    }

    if (enabled !== manifest.enabled) {
        mainWindows.every((passedWindow) => {
            if (enabled) {
                passedWindow.webContents.send(
                    "addTheme",
                    id,
                    fs.readFileSync(path.join(themesFolder, id, manifest.theme), "utf-8"),
                );
                console.log(`[Theme Manager] Loaded ${manifest.name} made by ${manifest.author}`);
            } else {
                passedWindow.webContents.send("removeTheme", id);
                console.log(`[Theme Manager] Removing ${manifest.name} made by ${manifest.author}`);
            }
        });
    }
    manifest.enabled = enabled;
    fs.writeFileSync(`${themesFolder}/${id}/manifest.json`, JSON.stringify(manifest));

    // Performance optimization: Invalidate cache
    themeManifestCache.delete(id);
}

export async function installTheme(linkOrPath: string) {
    let code = "";
    let isLinkImport = false;
    if (linkOrPath.startsWith("https://") || linkOrPath.startsWith("http://")) {
        code = await (await fetch(linkOrPath)).text();
        isLinkImport = true;
    } else {
        code = fs.readFileSync(linkOrPath, "utf8");
    }
    const manifest = parseBDManifest(code);
    const themePath = path.join(themesFolder, `${manifest.name?.replace(" ", "-")}-BD`);
    if (!fs.existsSync(themePath)) {
        fs.mkdirSync(themePath);
        console.log(`Created ${manifest.name} folder`);
    }
    if (isLinkImport && manifest.updateSrc === undefined) {
        manifest.updateSrc = linkOrPath;
    }
    if (code.includes(".titlebar")) manifest.supportsLegcordTitlebar = true;
    else manifest.supportsLegcordTitlebar = false;
    fs.writeFileSync(path.join(themePath, "manifest.json"), JSON.stringify(manifest));
    fs.writeFileSync(path.join(themePath, "src.css"), code);
}

export function initQuickCss(browserWindow: BrowserWindow) {
    if (process.argv.includes("--safe-mode")) return;
    const quickCssPath = path.join(userDataPath, "/quickCss.css");

    if (!fs.existsSync(quickCssPath)) {
        fs.writeFileSync(quickCssPath, "");
    }
    browserWindow.webContents.send("addTheme", "legcord-quick-css", fs.readFileSync(quickCssPath, "utf-8"));
    console.log("[Theme Manager] Loaded Quick CSS");

    // Performance optimization: Use fs.watch instead of fs.watchFile for better performance
    // Clean up existing watcher if any
    if (quickCssWatcher) {
        quickCssWatcher.close();
    }

    // Performance optimization: Debounce file changes to avoid excessive updates
    let updateTimeout: NodeJS.Timeout | null = null;
    quickCssWatcher = fs.watch(quickCssPath, (eventType) => {
        if (eventType === "change") {
            // Debounce: wait 300ms before updating to batch rapid changes
            if (updateTimeout) {
                clearTimeout(updateTimeout);
            }
            updateTimeout = setTimeout(() => {
                try {
                    console.log("[Theme Manager] Quick CSS updated.");
                    browserWindow.webContents.send("removeTheme", "legcord-quick-css");
                    browserWindow.webContents.send(
                        "addTheme",
                        "legcord-quick-css",
                        fs.readFileSync(quickCssPath, "utf-8"),
                    );
                } catch (err) {
                    console.error("[Theme Manager] Error updating Quick CSS:", err);
                }
            }, 300);
        }
    });

    // Clean up watcher when window is closed
    browserWindow.on("closed", () => {
        if (quickCssWatcher) {
            quickCssWatcher.close();
            quickCssWatcher = null;
        }
        if (updateTimeout) {
            clearTimeout(updateTimeout);
        }
    });
}

export function disableQuickCss(browserWindow: BrowserWindow) {
    // Clean up existing watcher if any
    if (quickCssWatcher) {
        quickCssWatcher.close();
        quickCssWatcher = null;
    }
    browserWindow.webContents.send("removeTheme", "legcord-quick-css");
}
