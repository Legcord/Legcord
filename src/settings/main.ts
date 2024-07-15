import {BrowserWindow, app, ipcMain, shell} from "electron";
import path from "path";
import {Settings} from "../types/settings.d.js";
import fs from "fs";
import {getDisplayVersion} from "../common/version.js";
import type {ThemeManifest} from "../types/themeManifest.d.js";
import {getConfig, setConfigBulk} from "../common/config.js";
let settingsWindow: BrowserWindow;
let instance = 0;

export async function createSettingsWindow(): Promise<void> {
    console.log("Creating a settings window.");
    instance += 1;
    if (instance > 1) {
        if (settingsWindow) {
            settingsWindow.show();
            settingsWindow.restore();
        }
    } else {
        settingsWindow = new BrowserWindow({
            width: 660,
            height: 670,
            title: `ArmCord Settings | Version: ${getDisplayVersion()}`,
            darkTheme: true,
            frame: true,
            backgroundColor: "#2f3136",
            autoHideMenuBar: true,
            webPreferences: {
                sandbox: false,
                preload: path.join(import.meta.dirname, "settings", "preload.mjs")
            }
        });
        ipcMain.on("saveSettings", (_event, args: Settings) => {
            setConfigBulk(args);
        });
        ipcMain.handle("getSetting", (_event, toGet: keyof Settings) => {
            return getConfig(toGet);
        });
        async function settingsLoadPage(): Promise<void> {
            await settingsWindow.loadURL(`file://${import.meta.dirname}/html/settings.html`);
        }
        const userDataPath = app.getPath("userData");
        const themesFolder = `${userDataPath}/themes/`;
        if (!fs.existsSync(themesFolder)) {
            fs.mkdirSync(themesFolder);
            console.log("Created missing theme folder");
        }
        if (!fs.existsSync(`${userDataPath}/disabled.txt`)) {
            fs.writeFileSync(path.join(userDataPath, "/disabled.txt"), "");
        }
        settingsWindow.webContents.on("did-finish-load", () => {
            fs.readdirSync(themesFolder).forEach((file) => {
                try {
                    const manifest = fs.readFileSync(`${themesFolder}/${file}/manifest.json`, "utf8");
                    const themeFile = JSON.parse(manifest) as ThemeManifest;
                    if (
                        fs
                            .readFileSync(path.join(userDataPath, "/disabled.txt"))
                            .toString()
                            .includes(themeFile.name.replace(" ", "-"))
                    ) {
                        console.log(`%cSkipped ${themeFile.name} made by ${themeFile.author}`, "color:red");
                    } else {
                        settingsWindow.webContents.send(
                            "themeLoader",
                            fs.readFileSync(`${themesFolder}/${file}/${themeFile.theme}`, "utf-8")
                        );
                        console.log(`%cLoaded ${themeFile.name} made by ${themeFile.author}`, "color:red");
                    }
                } catch (err) {
                    console.error(err);
                }
            });
        });
        settingsWindow.webContents.setWindowOpenHandler(({url}) => {
            void shell.openExternal(url);
            return {action: "deny"};
        });
        await settingsLoadPage();
        settingsWindow.on("close", () => {
            instance = 0;
        });
    }
}
