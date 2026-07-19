import { join } from "node:path";
import { app, Menu, nativeImage, Tray } from "electron";
import { getConfig } from "../common/config.js";
import { navigateTo } from "../common/dom.js";
import { setForceQuit } from "../common/forceQuit.js";
import { getLang } from "../common/lang.js";
import { getDisplayVersion } from "../common/version.js";
import { handleRestart } from "../main.js";
import { mainWindows } from "./window.js";
export let tray: Tray;

export function createTray() {
    let trayIcon = getConfig("tray");
    if (trayIcon === "disabled") {
        return;
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

    tray = new Tray(trayImg);
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
                    mainWindow.show();
                });
            },
        },
        {
            label: getLang("tray-openSettings"),
            click() {
                mainWindows.forEach((mainWindow) => {
                    mainWindow.show();
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
    tray.setContextMenu(contextMenu);

    tray.setToolTip(getLang("tray-tooltip"));
    tray.on("click", () => {
        mainWindows.forEach((mainWindow) => {
            mainWindow.show();
        });
    });
}
