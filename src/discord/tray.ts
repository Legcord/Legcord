import { join } from "node:path";
import { app, Menu, nativeImage, Tray } from "electron";
import { getConfig } from "../common/config.js";
import { setForceQuit } from "../common/forceQuit.js";
import { getLang } from "../common/lang.js";
import { getDisplayVersion } from "../common/version.js";
import { navigateTo, revealWindow } from "../common/windowVisibility.js";
import { handleRestart } from "../main.js";
import { mainWindows } from "./window.js";
export let tray: Tray;

export function createTray(): boolean {
    if (tray && !tray.isDestroyed()) return true;
    let trayIcon = getConfig("tray");
    if (trayIcon === "disabled") {
        return false;
    }
    if (trayIcon === "dynamic") {
        trayIcon = "ac_plug_colored";
    }
    let trayImg = nativeImage.createFromPath(join(import.meta.dirname, "../", `/assets/${trayIcon}.png`));
    switch (process.platform) {
        case "win32":
            trayImg = trayImg.resize({ height: 16 });
            break;
        case "darwin":
            trayImg = trayImg.resize({ height: 18 });
            break;
        case "linux":
            trayImg = trayImg.resize({ height: 24 });
            break;
    }

    const newTray = new Tray(trayImg);
    try {
        const contextMenu = Menu.buildFromTemplate([
            {
                label: `${getLang("menu-legcord")} ${getDisplayVersion()}`,
                icon: trayImg,
                enabled: false,
            },
            {
                type: "separator",
            },
            {
                label: getLang("tray-openLegcord"),
                click() {
                    mainWindows.forEach((mainWindow) => {
                        revealWindow(mainWindow);
                    });
                },
            },
            {
                label: getLang("tray-openSettings"),
                click() {
                    mainWindows.forEach((mainWindow) => {
                        revealWindow(mainWindow);
                    });
                },
            },
            {
                label: getLang("tray-supportServer"),
                click() {
                    mainWindows.forEach((mainWindow) => {
                        navigateTo(mainWindow, "/invite/TnhxcqynZ2");
                    });
                },
            },
            {
                type: "separator",
            },
            {
                label: getLang("tray-restartLegcord"),
                click() {
                    handleRestart();
                },
            },
            {
                label: getLang("tray-quitLegcord"),
                click() {
                    setForceQuit(true);
                    app.quit();
                },
            },
        ]);
        newTray.setContextMenu(contextMenu);

        newTray.setToolTip(getLang("tray-tooltip"));
        newTray.on("click", () => {
            mainWindows.forEach((mainWindow) => {
                revealWindow(mainWindow);
            });
        });
        tray = newTray;
        return true;
    } catch (error) {
        newTray.destroy();
        throw error;
    }
}
