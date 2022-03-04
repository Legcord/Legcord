import {BrowserWindow, shell, ipcMain} from "electron";
import * as storage from "electron-json-storage";
import {getConfigUnsafe, saveSettings, Settings} from "../utils";
import path from "path";
var settings: any;
var isAlreadyCreated: boolean = false;
storage.get("settings", function (error, data: any) {
    if (error) throw error;
    console.log(data);
    settings = data;
});
var settingsWindow: BrowserWindow;
export function createSettingsWindow() {
    if (isAlreadyCreated) {
        settingsWindow.show();
    } else {
        settingsWindow = new BrowserWindow({
            width: 500,
            height: 500,
            title: "ArmCord Settings",
            darkTheme: true,
            frame: true,
            autoHideMenuBar: true,
            webPreferences: {
                preload: path.join(__dirname, "preload.js")
            }
        });
        ipcMain.on("saveSettings", (event, args: Settings) => {
            console.log(args);
            saveSettings(args);
        });
        ipcMain.handle("getSetting", (event, toGet: string) => {
            return getConfigUnsafe(toGet);
        });
        settingsWindow.webContents.setWindowOpenHandler(({url}) => {
            shell.openExternal(url);
            return {action: "deny"};
        });
        settingsWindow.loadURL(`file://${__dirname}/settings.html`);
        settingsWindow.on("close", async (e) => {
            e.preventDefault();
            settingsWindow.hide();
        });
        isAlreadyCreated = true;
    }
}
