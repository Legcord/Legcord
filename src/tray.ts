import * as fs from "fs";
import {Menu, Tray, app, dialog, nativeImage} from "electron";
import {createInviteWindow, mainWindow} from "./window";
import {getConfig, getConfigLocation, getDisplayVersion, setConfig, setWindowState} from "./utils";
import * as path from "path";
import {createSettingsWindow} from "./settings/main";
export let tray: any = null;
let trayIcon = "ac_plug_colored";
app.whenReady().then(async () => {
    let finishedSetup = await getConfig("doneSetup");
    if ((await getConfig("trayIcon")) != "default") {
        trayIcon = await getConfig("trayIcon");
    }
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
    if (await getConfig("tray")) {
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
    } else {
        if ((await getConfig("tray")) == undefined) {
            if (process.platform == "win32") {
                const options = {
                    type: "question",
                    buttons: ["Yes, please", "No, I don't"],
                    defaultId: 1,
                    title: "Tray icon choice",
                    message: `Do you want to use tray icons?`,
                    detail: "Linux may not work well with tray icons. Depending on your system configuration, you may not be able to see the tray icon. Enable at your own risk. Can be changed later."
                };

                dialog.showMessageBox(mainWindow, options).then(({response}) => {
                    if (response == 0) {
                        setConfig("tray", true);
                    } else {
                        setConfig("tray", false);
                    }
                    app.relaunch();
                    app.exit();
                });
            } else {
                setConfig("tray", true);
                app.relaunch();
                app.exit();
            }
        }
    }
});
