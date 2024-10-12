import { join } from "node:path";
import { Menu, Tray, app, nativeImage } from "electron";
import { getConfig } from "../common/config.js";
import { setForceQuit } from "../common/forceQuit.js";
import { getDisplayVersion } from "../common/version.js";
import { createInviteWindow, mainWindows } from "./window.js";
export let tray: Tray;

let trayIcon: string;
export function createTray() {
    trayIcon = getConfig("trayIcon");
    if (trayIcon === "dynamic") trayIcon = "ac_plug_colored";
    let trayPath = nativeImage.createFromPath(join(import.meta.dirname, "../", `/assets/${trayIcon}.png`));
    switch (process.platform) {
        case "win32":
            trayPath = trayPath.resize({ height: 16 });
            break;
        case "darwin":
            trayPath = trayPath.resize({ height: 18 });
            break;
        case "linux":
            trayPath = trayPath.resize({ height: 24 });
            break;
        default:
            trayPath;
            break;
    }

    if (getConfig("tray")) {
        const clientName = getConfig("clientName") ?? "Legcord";
        tray = new Tray(trayPath);
        const contextMenu = Menu.buildFromTemplate([
            {
                label: `${clientName} ${getDisplayVersion()}`,
                icon: trayPath,
                enabled: false,
            },
            {
                type: "separator",
            },
            {
                label: `Open ${clientName}`,
                click() {
                    mainWindows.forEach((mainWindow) => {
                        mainWindow.show();
                    });
                },
            },
            {
                label: "Open Settings",
                click() {
                    mainWindows.forEach((mainWindow) => {
                        mainWindow.show();

                        void mainWindow.webContents.executeJavaScript(`window.shelter.flux.dispatcher.dispatch({
                                "type": "USER_SETTINGS_MODAL_OPEN",
                                "section": "My Account",
                                "subsection": null,
                                "openWithoutBackstack": false
                            })`);
                        void mainWindow.webContents.executeJavaScript(
                            `window.shelter.flux.dispatcher.dispatch({type: "LAYER_PUSH", component: "USER_SETTINGS"})`,
                        );
                        // TODO - open legcord tab in settings
                    });
                },
            },
            {
                label: "Support Discord Server",
                click() {
                    void createInviteWindow("TnhxcqynZ2");
                },
            },
            {
                type: "separator",
            },
            {
                label: `Quit ${clientName}`,
                click() {
                    setForceQuit(true);
                    app.quit();
                },
            },
        ]);
        tray.setContextMenu(contextMenu);

        tray.setToolTip(clientName);
        tray.on("click", () => {
            mainWindows.forEach((mainWindow) => {
                mainWindow.show();
            });
        });
    }
}
