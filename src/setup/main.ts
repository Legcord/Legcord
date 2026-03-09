import fs from "node:fs";
import { platform } from "node:os";
import path from "node:path";
import { BrowserWindow, type BrowserWindowConstructorOptions, app, ipcMain } from "electron";
import type { Settings } from "../@types/settings.js";
import { getConfig, getConfigLocation, setConfigBulk } from "../common/config.js";
import { getLang, getRawLang } from "../common/lang.js";
import { handleRestart } from "../main.js";

let setupWindow: BrowserWindow;
export async function createSetupWindow(): Promise<void> {
    if (platform() !== "darwin") import("./tray.js");
    return new Promise(() => {
        const windowOptions: BrowserWindowConstructorOptions = {
            width: 800,
            height: 600,
            title: getLang("setup-windowTitle"),
            darkTheme: true,
            icon: getConfig("customIcon") ?? path.join(import.meta.dirname, "../", "/assets/desktop.png"),
            resizable: false,
            frame: true,
            maximizable: false,
            autoHideMenuBar: true,
            webPreferences: {
                sandbox: true,
                spellcheck: false,
                preload: path.join(import.meta.dirname, "setup", "preload.mjs"),
            },
        };
        if (platform() === "darwin") {
            windowOptions.titleBarStyle = "hidden";
            windowOptions.titleBarOverlay = {
                color: "#2c2f33",
                symbolColor: "#99aab5",
                height: 30,
            };
            windowOptions.trafficLightPosition = {
                x: 13,
                y: 10,
            };
            windowOptions.frame = false;
            windowOptions.vibrancy = "fullscreen-ui";
        }
        setupWindow = new BrowserWindow(windowOptions);
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
        ipcMain.handle("setup-getRawLang", () => {
            return getRawLang();
        });
        ipcMain.on("setup-restart", () => {
            // workaround electron trying to relaunch from squashfs
            handleRestart();
        });
        void setupWindow.loadFile(path.join(import.meta.dirname, "/html/setup.html"));
    });
}
