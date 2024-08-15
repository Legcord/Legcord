import {BrowserWindow, ipcMain} from "electron";
import {iconPath} from "../main.js";
import path from "path";
import isDev from "electron-is-dev";
import {getConfig} from "../common/config.js";

export let splashWindow: BrowserWindow;
export async function createSplashWindow(): Promise<void> {
    splashWindow = new BrowserWindow({
        width: 300,
        height: 350,
        title: "ArmCord",
        show: true,
        darkTheme: true,
        icon: iconPath,
        frame: false,
        backgroundColor: "#202225",
        autoHideMenuBar: true,
        webPreferences: {
            sandbox: false,
            preload: path.join(import.meta.dirname, "splash", "preload.mjs")
        }
    });
    ipcMain.on("splash-isDev", (event) => {
        event.returnValue = isDev;
    });
    ipcMain.on("splash-clientmod", (event) => {
        event.returnValue = getConfig("mods");
    });
    await splashWindow.loadFile(path.join(import.meta.dirname, "html", "splash.html"));
}
