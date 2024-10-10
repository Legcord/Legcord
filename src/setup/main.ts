import fs from "node:fs";
import path from "node:path";
import { BrowserWindow, app, ipcMain } from "electron";
import type { Settings } from "../@types/settings.js";
import { getConfig, getConfigLocation, setConfigBulk } from "../common/config.js";
import { getLang } from "../common/lang.js";

let setupWindow: BrowserWindow;
export async function createSetupWindow(): Promise<void> {
    return new Promise((resolve) => {
        setupWindow = new BrowserWindow({
            width: 390,
            height: 470,
            title: "ArmCord Setup",
            darkTheme: true,
            icon: getConfig("customIcon") ?? path.join(import.meta.dirname, "../", "/assets/desktop.png"),
            frame: true,
            resizable: false,
            maximizable: false,
            autoHideMenuBar: true,
            webPreferences: {
                sandbox: false,
                spellcheck: false,
                preload: path.join(import.meta.dirname, "setup", "preload.mjs"),
            },
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
        ipcMain.on("setup-saveSettings", (_event, args: Settings) => {
            console.log(args);
            setConfigBulk(args);
        });
        ipcMain.on("setup-quit", () => {
            fs.unlink(getConfigLocation(), (err) => {
                if (err) throw err;

                console.log('Closed during setup. "settings.json" was deleted');
                app.quit();
            });
        });
        ipcMain.handle("setup-getLang", (_event, toGet: string) => {
            return getLang(toGet);
        });
        ipcMain.on("setup-restart", () => {
            app.relaunch();
            app.exit();
        });
        void setupWindow.loadURL(`file://${import.meta.dirname}/html/setup.html`);
    });
}
