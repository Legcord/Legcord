import * as fs from "fs";
import {Menu, Tray, app, nativeImage} from "electron";
import {createInviteWindow, mainWindow} from "./window";
import {getConfig, getConfigLocation, getDisplayVersion, setWindowState} from "./utils";
import * as path from "path";
import {createSettingsWindow} from "./settings/main";
import {clientName} from "./main";
export let tray: any = null;
app.whenReady().then(async () => {
    let finishedSetup = await getConfig("doneSetup");
    let trayIcon = (await getConfig("trayIcon")) ?? "ac_plug_colored";
    let trayPath = nativeImage.createFromPath(path.join(__dirname, "../", `/assets/${trayIcon}.png`));
    let trayVerIcon;
    trayVerIcon = function () {
        if (process.platform == "win32") {
            return trayPath.resize({height: 16});
        } else if (process.platform == "darwin") {
            return trayPath.resize({height: 18});
        } else if (process.platform == "linux") {
            return trayPath.resize({height: 24});
        }
        return undefined;
    };

    if (process.platform == "darwin" && trayPath.getSize().height > 22) trayPath = trayPath.resize({height: 22});

    let clientName = (await getConfig("clientName")) ?? "ArmCord";
    if ((await getConfig("windowStyle")) == "basic") {
        tray = new Tray(trayPath);
        function contextMenu(): Electron.Menu {
            if (finishedSetup == false) {
                return Menu.buildFromTemplate([
                    {
                        label: `Finish the setup first!`,
                        enabled: false
                    },
                    {
                        label: `Quit ${clientName}`,
                        async click() {
                            fs.unlink(await getConfigLocation(), (err) => {
                                if (err) throw err;

                                console.log('Closed during setup. "settings.json" was deleted');
                                app.quit();
                            });
                        }
                    }
                ]);
            } else {
                return Menu.buildFromTemplate([
                    {
                        label: `Open ${clientName}`,
                        click() {
                            mainWindow.show();
                        }
                    },
                    {
                        label: `Quit ${clientName}`,
                        click() {
                            let [width, height] = mainWindow.getSize();
                            setWindowState({
                                width,
                                height,
                                isMaximized: mainWindow.isMaximized(),
                                x: mainWindow.getPosition()[0],
                                y: mainWindow.getPosition()[1]
                            });
                            app.quit();
                        }
                    }
                ]);
            }
        }

        tray.setToolTip(clientName);
        tray.setContextMenu(contextMenu);
    } else {
        tray = new Tray(trayPath);
        if (finishedSetup == false) {
            const contextMenu = Menu.buildFromTemplate([
                {
                    label: `Finish the setup first!`,
                    enabled: false
                },
                {
                    label: `Quit ${clientName}`,
                    async click() {
                        fs.unlink(await getConfigLocation(), (err) => {
                            if (err) throw err;

                            console.log('Closed during setup. "settings.json" was deleted');
                            app.quit();
                        });
                    }
                }
            ]);
            tray.setContextMenu(contextMenu);
        } else {
            const contextMenu = Menu.buildFromTemplate([
                {
                    label: `${clientName} ${getDisplayVersion()}`,
                    icon: trayVerIcon(),
                    enabled: false
                },
                {
                    type: "separator"
                },
                {
                    label: `Open ${clientName}`,
                    click() {
                        mainWindow.show();
                    }
                },
                {
                    label: "Open Settings",
                    click() {
                        createSettingsWindow();
                    }
                },
                {
                    label: "Support Discord Server",
                    click() {
                        createInviteWindow("TnhxcqynZ2");
                    }
                },
                {
                    type: "separator"
                },
                {
                    label: `Quit ${clientName}`,
                    click() {
                        app.quit();
                    }
                }
            ]);
            tray.setContextMenu(contextMenu);
        }
    }
    tray.setToolTip(clientName);
    tray.on("click", function () {
        mainWindow.show();
    });
});
