import {BrowserWindow} from "electron";
import {iconPath} from "../main";
import path from "path";

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
            preload: path.join(import.meta.dirname, "preload.mjs")
        }
    });
    await splashWindow.loadFile(path.join(import.meta.dirname, "splash.html"));
}
