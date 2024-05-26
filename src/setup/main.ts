import {BrowserWindow, app, ipcMain} from "electron";
import path from "path";
import * as fs from "fs";
import {iconPath} from "../main";
import {Settings, getConfigLocation, setConfigBulk} from "../common/config";

let setupWindow: BrowserWindow;
export function createSetupWindow(): void {
    setupWindow = new BrowserWindow({
        width: 390,
        height: 470,
        title: "ArmCord Setup",
        darkTheme: true,
        icon: iconPath,
        frame: false,
        autoHideMenuBar: true,
        webPreferences: {
            sandbox: false,
            spellcheck: false,
            preload: path.join(import.meta.dirname, "preload.js")
        }
    });
    ipcMain.on("saveSettings", (_event, args: Settings) => {
        console.log(args);
        setConfigBulk(args);
    });
    ipcMain.on("setup-minimize", () => {
        setupWindow.minimize();
    });
    ipcMain.on("setup-getOS", (event) => {
        event.returnValue = process.platform;
    });
    ipcMain.on("setup-quit", async () => {
        fs.unlink(await getConfigLocation(), (err) => {
            if (err) throw err;

            console.log('Closed during setup. "settings.json" was deleted');
            app.quit();
        });
    });
    setupWindow.loadURL(`file://${import.meta.dirname}/setup.html`);
}
