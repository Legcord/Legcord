import fs from "node:fs";
import path from "node:path";
import { type BrowserWindow, app } from "electron";
import type { ThemeManifest } from "../@types/themeManifest.js";
import { mainWindows } from "../discord/window.js";
const userDataPath = app.getPath("userData");
const themesFolder = `${userDataPath}/themes/`;
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

    // FIXME - What the fuck is going on here
    // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
    let match;
    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    while ((match = metaReg.exec(content)) !== null) {
        const [_, key] = match;
        let [value] = match;
        if (key === "import") break;
        value = value.replace(`@${key}`, "");
        value = value.trim();

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
export function injectThemesMain(browserWindow: BrowserWindow): void {
    if (!fs.existsSync(themesFolder)) {
        fs.mkdirSync(themesFolder);
        console.log("Created missing theme folder");
    }
    browserWindow.webContents.on("did-finish-load", () => {
        fs.readdirSync(themesFolder).forEach((file) => {
            const themePath = `${themesFolder}/${file}`;
            if (fs.statSync(themePath).isFile()) {
                console.log(`[Theme Manager] Local theme detected: ${themePath}`);
                installTheme(themePath).then(() => {
                    fs.unlinkSync(themePath);
                });
            } else {
                try {
                    const manifest = fs.readFileSync(`${themePath}/manifest.json`, "utf8");
                    const themeFile = JSON.parse(manifest) as ThemeManifest;
                    if (themeFile.enabled === undefined) {
                        if (fs.readFileSync(`${userDataPath}/disabled.txt`).toString().includes(file)) {
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
        });
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
    const manifest = JSON.parse(fs.readFileSync(`${themesFolder}/${id}/manifest.json`, "utf8")) as ThemeManifest;
    if (enabled !== manifest.enabled) {
        mainWindows.every((passedWindow) => {
            if (enabled) {
                passedWindow.webContents.send(
                    "addTheme",
                    id,
                    fs.readFileSync(`${themesFolder}/${id}/${manifest.theme}`, "utf-8"),
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
    if (code.includes(".titlebar")) manifest.supportsArmCordTitlebar = true;
    else manifest.supportsArmCordTitlebar = false;
    fs.writeFileSync(path.join(themePath, "manifest.json"), JSON.stringify(manifest));
    fs.writeFileSync(path.join(themePath, "src.css"), code);
}

export function initQuickCss(browserWindow: BrowserWindow) {
    const quickCssPath = path.join(userDataPath, "/quickCss.css");
    if (!fs.existsSync(quickCssPath)) {
        fs.writeFileSync(quickCssPath, "");
    }
    browserWindow.webContents.send("addTheme", "armcord-quick-css", fs.readFileSync(quickCssPath, "utf-8"));
    console.log("[Theme Manager] Loaded Quick CSS");
    fs.watchFile(quickCssPath, { interval: 1000 }, () => {
        console.log("[Theme Manager] Quick CSS updated.");
        browserWindow.webContents.send("removeTheme", "armcord-quick-css");
        browserWindow.webContents.send("addTheme", "armcord-quick-css", fs.readFileSync(quickCssPath, "utf-8"));
    });
}
