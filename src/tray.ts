import { unlink } from "node:fs";
import { join } from "node:path";
import { Menu, Tray, app, nativeImage } from "electron";
import { getConfig, getConfigLocation } from "./common/config.js";
import { setForceQuit } from "./common/forceQuit.js";
import { getDisplayVersion } from "./common/version.js";
import { createInviteWindow, mainWindows } from "./discord/window.js";
export let tray: Tray;

let trayIcon = "ac_plug_colored";
void app.whenReady().then(() => {
    // NOTE - app will hang at startup if line above is awaited.
    const finishedSetup = getConfig("doneSetup");
    trayIcon = getConfig("trayIcon");
    let trayPath = nativeImage.createFromPath(join(import.meta.dirname, "../", `/assets/${trayIcon}.png`));
    const trayVerIcon = () => {
        switch (process.platform) {
            case "win32":
                return trayPath.resize({ height: 16 });
            case "darwin":
                return trayPath.resize({ height: 18 });
            case "linux":
                return trayPath.resize({ height: 24 });
            default:
                return trayPath; // NOTE - If you fall under this condition, feel free to submit a PR if there are issues.
        }
    };

    if (process.platform === "darwin" && trayPath.getSize().height > 22) trayPath = trayPath.resize({ height: 22 });
    if (getConfig("tray")) {
        const clientName = getConfig("clientName") ?? "ArmCord";
        tray = new Tray(trayPath);
        if (finishedSetup === false) {
            const contextMenu = Menu.buildFromTemplate([
                {
                    label: "Finish the setup first!",
                    enabled: false,
                },
                {
                    label: `Quit ${clientName}`,
                    click() {
                        unlink(getConfigLocation(), (err) => {
                            if (err) throw err;

                            console.log('Closed during setup. "settings.json" was deleted');
                            app.quit();
                        });
                    },
                },
            ]);
            tray.setContextMenu(contextMenu);
        } else {
            const contextMenu = Menu.buildFromTemplate([
                // NOTE - Awaiting any window creation will fail silently
                {
                    label: `${clientName} ${getDisplayVersion()}`,
                    icon: trayVerIcon(),
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
                            // TODO - open armcord tab in settings
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
        }
        tray.setToolTip(clientName);
        tray.on("click", () => {
            mainWindows.forEach((mainWindow) => {
                mainWindow.show();
            });
        });
    }
});
