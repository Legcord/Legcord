import fs from "node:fs";
import path from "node:path";
import { BrowserWindow, type MessageBoxOptions, app, dialog, ipcMain, shell } from "electron";
import type { ThemeManifest } from "../@types/themeManifest.js";
import { installTheme, setThemeEnabled, uninstallTheme } from "../common/themes.js";
import { createInviteWindow, mainWindows } from "../discord/window.js";
let themeWindow: BrowserWindow;
let instance = 0;

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
            title: "Legcord Theme Manager",
            darkTheme: true,
            frame: true,
            backgroundColor: "#2f3136",
            autoHideMenuBar: true,
            webPreferences: {
                sandbox: false,
                preload: path.join(import.meta.dirname, "themeManager", "preload.mjs"),
            },
        });
        //setWindowHandler doesn't work for some reason
        themeWindow.webContents.on("will-navigate", (e, url) => {
            /* If url isn't the actual page */
            if (url !== themeWindow.webContents.getURL()) {
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
        ipcMain.on("setThemeEnabled", (_event, name: string, enabled: boolean) => {
            setThemeEnabled(name, enabled);
        });
        ipcMain.on("editTheme", (_event, id: string) => {
            const manifest = JSON.parse(
                fs.readFileSync(`${themesFolder}/${id}/manifest.json`, "utf8"),
            ) as ThemeManifest;
            void shell.openPath(`${themesFolder}/${id}/${manifest.theme}`);
        });
        ipcMain.on("openThemeFolder", (_event, id: string) => {
            void shell.openPath(path.join(themesFolder, id));
        });
        ipcMain.on("uninstallTheme", (_event, id: string) => {
            const options: MessageBoxOptions = {
                type: "warning",
                buttons: ["Yes, please", "No, cancel"],
                defaultId: 1,
                title: "Remove theme",
                message: "Are you sure you want to remove this theme?",
            };

            void dialog.showMessageBox(mainWindows[0], options).then(({ response }) => {
                if (response === 0) {
                    uninstallTheme(id);
                    themeWindow.webContents.reload();
                    mainWindows.forEach((mainWindow) => {
                        mainWindow.webContents.reload();
                    });
                }
            });
        });
        ipcMain.handle("installBDTheme", async (_event, link: string) => {
            await installTheme(link)
                .then(() => {
                    dialog.showMessageBoxSync({
                        type: "info",
                        title: "BD Theme import success",
                        message: "Successfully imported theme from link.",
                    });
                    themeWindow.webContents.reload();
                    mainWindows.forEach((mainWindow) => {
                        mainWindow.webContents.reload();
                    });
                })
                .catch((err) => {
                    dialog.showErrorBox(
                        "BD Theme import fail",
                        "Failed to import theme from link. Please make sure that it's a valid BetterDiscord Theme.",
                    );
                    console.error(err);
                });
        });
        themeWindow.webContents.on("did-finish-load", () => {
            fs.readdirSync(themesFolder).forEach((file) => {
                try {
                    const manifest = JSON.parse(
                        fs.readFileSync(`${themesFolder}/${file}/manifest.json`, "utf8"),
                    ) as ThemeManifest;
                    console.log(manifest);
                    if (manifest.enabled === undefined) {
                        if (fs.readFileSync(`${userDataPath}/disabled.txt`).toString().includes(file)) {
                            manifest.enabled = false;
                        } else {
                            manifest.enabled = true;
                        }
                    }
                    themeWindow.webContents.send("themeManifest", file, JSON.stringify(manifest));
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
