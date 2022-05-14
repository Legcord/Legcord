import { app, Menu, Tray } from "electron";
import { mainWindow } from "./window";
import { getConfig } from "./utils";
import * as path from "path";
import { createSettingsWindow } from "./settings/main";
let tray: any = null;
app.whenReady().then(async () => {
    if (await getConfig("windowStyle") == "discord") {
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
        tray = new Tray(path.join(__dirname, "../", "/assets/ac_plug.png"));
        const contextMenu = Menu.buildFromTemplate([
            {
                label: "ArmCord",
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
