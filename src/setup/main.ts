import {BrowserWindow, app, ipcMain} from "electron";
import path from "path";
import fs from "fs";
import {iconPath} from "../main.js";
import {setConfigBulk, getConfigLocation} from "../common/config.js";
import type {Settings} from "../types/settings.d.js";

let setupWindow: BrowserWindow;
export async function createSetupWindow(): Promise<void> {
    // NOTE - intentionally hang the process until setup is completed
    return new Promise((resolve) => {
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
            resolve();
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
        void setupWindow.loadURL(`file://${import.meta.dirname}/setup.html`);
    });
}
