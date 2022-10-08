import * as fs from "fs";
import {app, Menu, Tray, nativeImage} from "electron";
import {mainWindow} from "./window";
import {getConfig, getConfigLocation, setWindowState, getDisplayVersion} from "./utils";
import * as path from "path";
import {createSettingsWindow} from "./settings/main";
export let tray: any = null;
app.whenReady().then(async () => {
    let finishedSetup = await getConfig("doneSetup");
    var trayIcon = (await getConfig("trayIcon")) ?? "ac_plug_colored";
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
    };

    if (process.platform == "darwin" && trayPath.getSize().height > 22) trayPath = trayPath.resize({height: 22});

    if ((await getConfig("windowStyle")) == "basic") {
        var clientName = (await getConfig("clientName")) ?? "ArmCord";
        tray = new Tray(trayPath);
        const contextMenu = function () {
            if (finishedSetup == false) {
                return Menu.buildFromTemplate([
                    {
                        label: `Finish the setup first!`,
                        enabled: false
                    },
                    {
                        label: `Quit ${clientName}`,
                        click: async function () {
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
                        click: function () {
                            mainWindow.show();
                        }
                    },
                    {
                        label: `Quit ${clientName}`,
                        click: function () {
                            let [width, height] = mainWindow.getSize();
                            setWindowState({width: width, height: height, isMaximized: mainWindow.isMaximized()});
                            app.quit();
                        }
                    }
                ]);
            }
        };

        tray.setToolTip(clientName);
        tray.setContextMenu(contextMenu);
    } else {
        var clientName = (await getConfig("clientName")) ?? "ArmCord";
        tray = new Tray(trayPath);
        if (finishedSetup == false) {
            const contextMenu = Menu.buildFromTemplate([
                {
                    label: `Finish the setup first!`,
                    enabled: false
                },
                {
                    label: `Quit ${clientName}`,
                    click: async function () {
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
                    label: `${clientName} ` + getDisplayVersion(),
                    icon: trayVerIcon(),
                    enabled: false
                },
                {
                    type: "separator"
                },
                {
                    label: `Open ${clientName}`,
                    click: function () {
                        mainWindow.show();
                    }
                },
                {
                    label: "Open Settings",
                    click: function () {
                        createSettingsWindow();
                    }
                },
                {
                    label: "Support Discord Server",
                    click: function () {
                        mainWindow.show();
                        mainWindow.loadURL("https://discord.gg/TnhxcqynZ2");
                    }
                },
                {
                    type: "separator"
                },
                {
                    label: `Quit ${clientName}`,
                    click: function () {
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
