import {BrowserWindow, ipcMain} from "electron";
import {iconPath} from "../main.js";
import path from "path";
import isDev from "electron-is-dev";

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
            preload: path.join(import.meta.dirname, "splash", "preload.js")
        }
    });
    ipcMain.on("isDev", (event) => {
        event.returnValue = isDev;
    });
    await splashWindow.loadFile(path.join(import.meta.dirname, "splash.html"));
}
