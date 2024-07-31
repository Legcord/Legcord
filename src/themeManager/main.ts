import {BrowserWindow, app, dialog, ipcMain, shell} from "electron";
import path from "path";
import fs from "fs";
import {createInviteWindow, mainWindows} from "../discord/window.js";
import type {ThemeManifest} from "../types/themeManifest.d.js";
let themeWindow: BrowserWindow;
let instance = 0;

function parseBDManifest(content: string) {
    const metaReg = /@([^ ]*) (.*)/g;
    if (!content.startsWith("/**")) {
        throw new Error("Not a manifest.");
    }
    const manifest: ThemeManifest = {theme: "src.css", name: "null"}; // Will be defined later

    let match;
    while ((match = metaReg.exec(content)) !== null) {
        const [_, key] = match;
        let [value] = match;
        if (key === "import") break;
        value = value.replace("@" + key, "");
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
const userDataPath = app.getPath("userData");
const themesPath = path.join(userDataPath, "/themes/");
export async function createTManagerWindow(): Promise<void> {
    console.log("Creating theme manager window.");
    instance += 1;
    if (instance > 1) {
        if (themeWindow) {
            themeWindow.show();
            themeWindow.restore();
        }
    } else {
        themeWindow = new BrowserWindow({
            width: 700,
            height: 600,
            title: `ArmCord Theme Manager`,
            darkTheme: true,
            frame: true,
            backgroundColor: "#2f3136",
            autoHideMenuBar: true,
            webPreferences: {
                sandbox: false,
                preload: path.join(import.meta.dirname, "themeManager", "preload.mjs")
            }
        });
        //setWindowHandler doesn't work for some reason
        themeWindow.webContents.on("will-navigate", function (e, url) {
            /* If url isn't the actual page */
            if (url != themeWindow.webContents.getURL()) {
                e.preventDefault();
                if (url.startsWith("https://discord.gg/")) {
                    createInviteWindow(url.replace("https://discord.gg/", ""));
                } else {
                    void shell.openExternal(url);
                }
            }
        });

        const userDataPath = app.getPath("userData");
        const themesFolder = `${userDataPath}/themes/`;
        if (!fs.existsSync(themesFolder)) {
            fs.mkdirSync(themesFolder);
            console.log("Created missing theme folder");
        }
        if (!fs.existsSync(`${userDataPath}/disabled.txt`)) {
            fs.writeFileSync(path.join(userDataPath, "/disabled.txt"), "");
        }
        ipcMain.on("openThemesFolder", () => {
            shell.showItemInFolder(themesPath);
        });
        ipcMain.on("reloadMain", () => {
            mainWindows.forEach((mainWindow) => {
                mainWindow.webContents.reload();
            });
        });
        ipcMain.on("addToDisabled", (_event, name: string) => {
            fs.appendFileSync(path.join(userDataPath, "/disabled.txt"), `${name}\n`);
        });
        ipcMain.on("disabled", (e) => {
            e.returnValue = fs.readFileSync(path.join(userDataPath, "/disabled.txt")).toString();
        });
        ipcMain.on("removeFromDisabled", (_event, name: string) => {
            const e = fs.readFileSync(path.join(userDataPath, "/disabled.txt")).toString();
            fs.writeFileSync(path.join(userDataPath, "/disabled.txt"), e.replace(name, ""));
        });
        ipcMain.on("uninstallTheme", (_event, id: string) => {
            const themePath = path.join(themesFolder, id);
            if (fs.existsSync(themePath)) {
                fs.rmdirSync(themePath, {recursive: true});
                console.log(`Removed ${id} folder`);
            } else if (fs.existsSync(path.join(themesFolder, `${id}-BD`))) {
                fs.rmdirSync(path.join(themesFolder, `${id}-BD`), {recursive: true});
                console.log(`Removed ${id} folder`);
            }
            themeWindow.webContents.reload();
            mainWindows.forEach((mainWindow) => {
                mainWindow.webContents.reload();
            });
        });
        ipcMain.handle("installBDTheme", async (_event, link: string) => {
            try {
                const code = await (await fetch(link)).text();
                const manifest = parseBDManifest(code);
                const themePath = path.join(themesFolder, `${manifest.name?.replace(" ", "-")}-BD`);
                if (!fs.existsSync(themePath)) {
                    fs.mkdirSync(themePath);
                    console.log(`Created ${manifest.name} folder`);
                }
                manifest.updateSrc = link;
                if (code.includes(".titlebar")) manifest.supportsArmCordTitlebar = true;
                else manifest.supportsArmCordTitlebar = false;
                fs.writeFileSync(path.join(themePath, "manifest.json"), JSON.stringify(manifest));
                fs.writeFileSync(path.join(themePath, "src.css"), code);
                dialog.showMessageBoxSync({
                    type: "info",
                    title: "BD Theme import success",
                    message: "Successfully imported theme from link."
                });
                themeWindow.webContents.reload();
                mainWindows.forEach((mainWindow) => {
                    mainWindow.webContents.reload();
                });
            } catch (e) {
                dialog.showErrorBox(
                    "BD Theme import fail",
                    "Failed to import theme from link. Please make sure that it's a valid BetterDiscord Theme."
                );
            }
        });
        themeWindow.webContents.on("did-finish-load", () => {
            fs.readdirSync(themesFolder).forEach((file) => {
                try {
                    const manifest = fs.readFileSync(`${themesFolder}/${file}/manifest.json`, "utf8");
                    console.log(manifest);
                    themeWindow.webContents.send("themeManifest", manifest);
                } catch (err) {
                    console.error(err);
                }
            });
        });

        await themeWindow.loadFile(`${import.meta.dirname}/html/manager.html`);
        themeWindow.on("close", () => {
            instance = 0;
        });
    }
}
