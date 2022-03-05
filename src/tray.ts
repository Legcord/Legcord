import {app, Menu, Tray} from "electron";
import {mainWindow} from "./window";
import * as path from "path";
import {createSettingsWindow} from "./settings/main";
let tray = null;
app.whenReady().then(() => {
    tray = new Tray(path.join(__dirname, "../", "/assets/ac_plug.png"));
    const contextMenu = Menu.buildFromTemplate([
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
            label: "Quit ArmCord",
            click: function () {
                app.quit();
            }
        }
    ]);

    tray.setToolTip("ArmCord " + app.getVersion());
    tray.setContextMenu(contextMenu);
});
