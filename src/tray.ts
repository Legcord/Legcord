import {app, Menu, Tray} from "electron";
import {mainWindow} from "./window";
import {getConfig} from "./utils";
import * as path from "path";
import {createSettingsWindow} from "./settings/main";
import {platform} from "process";
let tray: any = null;
let defaultIcon = "ac_plug_colored";
app.whenReady().then(async () => {
    if (platform == "darwin") {
        defaultIcon = "macos"
    }
    if ((await getConfig("windowStyle")) == "discord") {
        tray = new Tray(path.join(__dirname, "../", "/assets/dsc-tray.png"));
        const contextMenu = Menu.buildFromTemplate([
            {
                label: "Open ArmCord",
                click: function () {
                    mainWindow.show();
                }
            },
            {
                label: "Quit ArmCord",
                click: function () {
                    app.quit();
                }
            }
        ]);

        tray.setToolTip("Discord");
        tray.setContextMenu(contextMenu);
    } else {
        var trayIcon = (await getConfig("trayIcon")) ?? defaultIcon;
        tray = new Tray(path.join(__dirname, "../", `/assets/${trayIcon}.png`));
        const contextMenu = Menu.buildFromTemplate([
            {
                label: "ArmCord"
            },
            {
                type: "separator"
            },
            {
                label: "Open ArmCord",
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
                label: "Quit ArmCord",
                click: function () {
                    app.quit();
                }
            }
        ]);

        tray.setToolTip("ArmCord " + app.getVersion());
        tray.setContextMenu(contextMenu);
    }
});
