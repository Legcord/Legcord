import {BrowserWindow, shell, ipcMain} from "electron";
import {getConfig, setConfigBulk, Settings, getLang} from "../utils";
import path from "path";
var settingsWindow: BrowserWindow;
var instance: number = 0;

export function createSettingsWindow() {
    console.log("Creating a settings window.");
    instance = instance + 1;
    if (instance > 1) {
        if (settingsWindow) {
            settingsWindow.show();
            settingsWindow.restore();
        }
    } else {
        settingsWindow = new BrowserWindow({
            width: 500,
            height: 555,
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
            setConfigBulk(args);
        });
        ipcMain.handle("getSetting", (event, toGet: string) => {
            return getConfig(toGet);
        });
        ipcMain.handle("getLang", (event, toGet: string) => {
            return getLang(toGet);
        });
        settingsWindow.webContents.setWindowOpenHandler(({url}) => {
            shell.openExternal(url);
            return {action: "deny"};
        });
        settingsWindow.loadURL(`file://${__dirname}/settings.html`);
        settingsWindow.on("close", (event: Event) => {
            ipcMain.removeHandler("getSetting");
            ipcMain.removeHandler("getLang");
            ipcMain.removeAllListeners("saveSettings");
            instance = 0;
        });
    }
}
