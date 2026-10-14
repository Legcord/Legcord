import fs from "node:fs";
import path from "node:path";
import { app, type BrowserWindow } from "electron";
import type { ThemeManifest } from "../@types/themeManifest.js";
import { mainWindows } from "../discord/window.js";
import { getConfig } from "./config.js";
import { resolvePathUnderBaseDir } from "./sanitization.js";

const themeManifestCache = new Map<string, { manifest: ThemeManifest; mtime: number }>();
const themeCssCache = new Map<string, string>();
let quickCssWatcher: fs.FSWatcher | null = null;

let userDataPath: string;
let themesFolder: string;

void app.whenReady().then(() => {
    userDataPath = app.getPath("userData");
    themesFolder = path.join(userDataPath, "/themes/");
});

/** Resolve a theme directory under themesFolder; null if id escapes the themes dir. */
export function resolveThemeDir(themeId: string): string | null {
    if (typeof themeId !== "string" || themeId.length === 0 || themeId.length > 255) return null;
    return resolvePathUnderBaseDir(themesFolder, themeId);
}

/** Resolve a file inside a theme directory; null if it escapes the theme dir. */
export function resolveThemeFile(themeId: string, relativeFile: string): string | null {
    const themeDir = resolveThemeDir(themeId);
    if (!themeDir) return null;
    if (typeof relativeFile !== "string" || relativeFile.length === 0) return null;
    return resolvePathUnderBaseDir(themeDir, relativeFile);
}

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
    const themePath = resolveThemeDir(themeId);
    if (!themePath) return null;
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

let themeListCache: ThemeManifest[] | null = null;
let themeWatcher: fs.FSWatcher | null = null;
let themeListRefreshTimeout: NodeJS.Timeout | null = null;

function importLooseThemeFiles(): void {
    try {
        if (!fs.existsSync(themesFolder)) return;
        const entries = fs.readdirSync(themesFolder);
        for (const entry of entries) {
            const entryPath = path.join(themesFolder, entry);
            const stat = fs.statSync(entryPath);
            if (stat.isFile() && (entry.endsWith(".css") || entry.endsWith(".theme.css"))) {
                const code = fs.readFileSync(entryPath, "utf8");
                installThemeFromCode(code);
                try {
                    fs.unlinkSync(entryPath);
                } catch {}
            }
        }
    } catch (err) {
        console.error("[Theme Manager] Failed to import loose theme files:", err);
    }
}

function refreshThemeListCache(): ThemeManifest[] {
    try {
        if (!fs.existsSync(themesFolder)) {
            themeListCache = [];
            return themeListCache;
        }
        const themes: ThemeManifest[] = [];
        const entries = fs.readdirSync(themesFolder);
        for (const entry of entries) {
            const manifestPath = path.join(themesFolder, entry, "manifest.json");
            if (fs.existsSync(manifestPath)) {
                const manifest = getThemeManifest(entry);
                if (manifest) {
                    themes.push({ ...manifest, id: entry });
                }
            }
        }
        themeListCache = themes;
        return themes;
    } catch (err) {
        console.error("[Theme Manager] Failed to refresh theme list cache:", err);
        return themeListCache ?? [];
    }
}

export function getCachedThemeList(): ThemeManifest[] {
    if (themeListCache) {
        return themeListCache;
    }
    importLooseThemeFiles();
    return refreshThemeListCache();
}

export function invalidateThemeListCache(): void {
    themeListCache = null;
}

function debouncedRefreshThemeList(): void {
    if (themeListRefreshTimeout) {
        clearTimeout(themeListRefreshTimeout);
    }
    themeListRefreshTimeout = setTimeout(() => {
        refreshThemeListCache();
        themeListRefreshTimeout = null;
    }, 500);
}

export function startThemeWatcher(): void {
    if (themeWatcher) return;
    try {
        if (!fs.existsSync(themesFolder)) {
            fs.mkdirSync(themesFolder, { recursive: true });
        }
        themeWatcher = fs.watch(themesFolder, { recursive: true }, (eventType, filename) => {
            if (filename && (filename.endsWith("manifest.json") || eventType === "rename")) {
                debouncedRefreshThemeList();
            }
        });
        refreshThemeListCache();
    } catch (err) {
        console.error("[Theme Manager] Failed to start theme watcher:", err);
    }
}

export function stopThemeWatcher(): void {
    if (themeWatcher) {
        themeWatcher.close();
        themeWatcher = null;
    }
    if (themeListRefreshTimeout) {
        clearTimeout(themeListRefreshTimeout);
        themeListRefreshTimeout = null;
    }
}

function buildThemeCssCache(): void {
    themeCssCache.clear();
    if (!fs.existsSync(themesFolder)) return;
    const files = fs.readdirSync(themesFolder);
    for (const file of files) {
        const themePath = path.join(themesFolder, file);
        if (fs.statSync(themePath).isFile() && (file.endsWith(".css") || file.endsWith(".theme.css"))) {
            try {
                const code = fs.readFileSync(themePath, "utf8");
                installThemeFromCode(code);
                fs.unlinkSync(themePath);
            } catch {}
        } else {
            try {
                const themeFile = getThemeManifest(file);
                if (!themeFile) continue;

                if (themeFile.enabled === undefined) {
                    themeFile.enabled = false;
                }
                if (themeFile.enabled === true) {
                    const cssPath = resolveThemeFile(file, themeFile.theme);
                    if (!cssPath || !fs.existsSync(cssPath)) continue;
                    themeCssCache.set(file, fs.readFileSync(cssPath, "utf-8"));
                }
            } catch (err) {
                console.error(err);
            }
        }
    }
}

export function injectThemesMain(browserWindow: BrowserWindow): void {
    if (process.argv.includes("--safe-mode")) return;
    if (!fs.existsSync(themesFolder)) {
        fs.mkdirSync(themesFolder);
        console.log("Created missing theme folder");
    }
    buildThemeCssCache();
    browserWindow.webContents.on("did-finish-load", () => {
        buildThemeCssCache();
        if (getConfig("quickCss")) initQuickCss(browserWindow);
        for (const [id, css] of themeCssCache) {
            if (!browserWindow.isDestroyed()) {
                browserWindow.webContents.send("addTheme", id, css);
            }
        }
    });
}

export function uninstallTheme(id: string) {
    const themePath = resolveThemeDir(id);
    const bdPath = resolveThemeDir(`${id}-BD`);
    if (themePath && fs.existsSync(themePath)) {
        fs.rmSync(themePath, { recursive: true });
        console.log(`Removed ${id} folder`);
    } else if (bdPath && fs.existsSync(bdPath)) {
        fs.rmSync(bdPath, { recursive: true });
        console.log(`Removed ${id} folder`);
    }
    for (const win of mainWindows) {
        if (!win.isDestroyed()) win.webContents.send("removeTheme", id);
    }
    themeCssCache.delete(id);
    themeManifestCache.delete(id);
    invalidateThemeListCache();
}

export function setThemeEnabled(id: string, enabled: boolean) {
    const themePath = resolveThemeDir(id);
    if (!themePath) {
        console.warn(`[Theme Manager] Rejected unsafe theme id: ${id}`);
        return;
    }

    let manifest = getThemeManifest(id);
    if (!manifest) {
        const manifestPath = path.join(themePath, "manifest.json");
        if (!fs.existsSync(manifestPath)) return;
        manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as ThemeManifest;
    }

    if (enabled !== manifest.enabled) {
        for (const passedWindow of mainWindows) {
            if (enabled) {
                const cssPath = resolveThemeFile(id, manifest.theme);
                if (!cssPath || !fs.existsSync(cssPath)) continue;
                const css = fs.readFileSync(cssPath, "utf-8");
                themeCssCache.set(id, css);
                if (!passedWindow.isDestroyed()) {
                    passedWindow.webContents.send("addTheme", id, css);
                }
                console.log(`[Theme Manager] Loaded ${manifest.name} made by ${manifest.author}`);
            } else {
                themeCssCache.delete(id);
                if (!passedWindow.isDestroyed()) {
                    passedWindow.webContents.send("removeTheme", id);
                }
                console.log(`[Theme Manager] Removing ${manifest.name} made by ${manifest.author}`);
            }
        }
    }
    manifest.enabled = enabled;
    fs.writeFileSync(path.join(themePath, "manifest.json"), JSON.stringify(manifest));

    themeManifestCache.delete(id);
    invalidateThemeListCache();
}

function installThemeFromCode(code: string, linkOrPath?: string): void {
    const manifest = parseBDManifest(code);
    const rawName = typeof manifest.name === "string" ? manifest.name.replaceAll(" ", "-") : "theme";
    const dirName = `${rawName}-BD`;
    const themePath = resolvePathUnderBaseDir(themesFolder, dirName);
    if (!themePath) {
        console.warn(`[Theme Manager] Rejected unsafe theme install name: ${manifest.name}`);
        return;
    }
    if (!fs.existsSync(themePath)) {
        fs.mkdirSync(themePath);
        console.log(`Created ${manifest.name} folder`);
    }
    if (linkOrPath && manifest.updateSrc === undefined) {
        manifest.updateSrc = linkOrPath;
    }
    if (code.includes(".titlebar")) manifest.supportsLegcordTitlebar = true;
    else manifest.supportsLegcordTitlebar = false;
    fs.writeFileSync(path.join(themePath, "manifest.json"), JSON.stringify(manifest));
    fs.writeFileSync(path.join(themePath, "src.css"), code);
    invalidateThemeListCache();
}

export async function installTheme(linkOrPath: string, options: { allowLocalPath?: boolean } = {}) {
    let code = "";
    let isLinkImport = false;
    if (linkOrPath.startsWith("https://") || linkOrPath.startsWith("http://")) {
        code = await (await fetch(linkOrPath)).text();
        isLinkImport = true;
    } else if (options.allowLocalPath) {
        code = fs.readFileSync(linkOrPath, "utf8");
    } else {
        console.warn("[Theme Manager] Rejected non-HTTP theme install from untrusted source");
        return;
    }
    installThemeFromCode(code, isLinkImport ? linkOrPath : undefined);
}

export function initQuickCss(browserWindow: BrowserWindow) {
    if (process.argv.includes("--safe-mode")) return;
    const quickCssPath = path.join(userDataPath, "/quickCss.css");

    if (!fs.existsSync(quickCssPath)) {
        fs.writeFileSync(quickCssPath, "");
    }
    if (!browserWindow.isDestroyed()) {
        browserWindow.webContents.send("addTheme", "legcord-quick-css", fs.readFileSync(quickCssPath, "utf-8"));
    }
    console.log("[Theme Manager] Loaded Quick CSS");

    if (quickCssWatcher) {
        quickCssWatcher.close();
    }

    let updateTimeout: NodeJS.Timeout | null = null;
    quickCssWatcher = fs.watch(quickCssPath, (eventType) => {
        if (eventType === "change") {
            if (updateTimeout) {
                clearTimeout(updateTimeout);
            }
            updateTimeout = setTimeout(() => {
                try {
                    console.log("[Theme Manager] Quick CSS updated.");
                    if (!browserWindow.isDestroyed()) {
                        browserWindow.webContents.send(
                            "addTheme",
                            "legcord-quick-css",
                            fs.readFileSync(quickCssPath, "utf-8"),
                        );
                    }
                } catch (err) {
                    console.error("[Theme Manager] Error updating Quick CSS:", err);
                }
            }, 300);
        }
    });

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
    if (quickCssWatcher) {
        quickCssWatcher.close();
        quickCssWatcher = null;
    }
    if (!browserWindow.isDestroyed()) {
        browserWindow.webContents.send("removeTheme", "legcord-quick-css");
    }
}
