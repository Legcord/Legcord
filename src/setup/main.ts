import {BrowserWindow, app, ipcMain} from "electron";
import path from "path";
import fs from "fs";
import {iconPath} from "../main";
import {setConfigBulk, getConfigLocation} from "../common/config";
import type {Settings} from "../types/settings";

let setupWindow: BrowserWindow;
export async function createSetupWindow(): Promise<void> {
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
            preload: path.join(import.meta.dirname, "preload.mjs")
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
    ipcMain.on("setup-quit", () => {
        fs.unlink(getConfigLocation(), (err) => {
            if (err) throw err;

            console.log('Closed during setup. "settings.json" was deleted');
            app.quit();
        });
    });
    await setupWindow.loadURL(`file://${import.meta.dirname}/setup.html`);
}
