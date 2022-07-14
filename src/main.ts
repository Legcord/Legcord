// Modules to control application life and create native browser window
import {app, BrowserWindow, session} from "electron";
import "v8-compile-cache";
import {getConfig, checkIfConfigExists, injectElectronFlags} from "./utils";
import "./extensions/mods";
import "./extensions/plugin";
import "./tray";
import {createCustomWindow, createNativeWindow} from "./window";

export var settings: any;
export var customTitlebar: boolean;
export var clientName: "ArmCord";

if (process.platform == "linux") {
    if (process.env.$XDG_SESSION_TYPE == "wayland") {
        console.log("Wayland specific patches applied.");
        app.commandLine.appendSwitch("ozone-platform=wayland");
        if (process.env.$XDG_CURRENT_DESKTOP == "GNOME") {
            app.commandLine.appendSwitch("enable-features=UseOzonePlatform,WaylandWindowDecorations");
        } else {
            app.commandLine.appendSwitch("enable-features=UseOzonePlatform");
        }
    }
}
checkIfConfigExists();
injectElectronFlags();
app.whenReady().then(async () => {
    async function init() {
        switch (await getConfig("windowStyle")) {
            case "default":
                createCustomWindow();
                customTitlebar = true;
                break;
            case "native":
                createNativeWindow();
                break;
            case "basic":
                createNativeWindow();
                break;
            default:
                createCustomWindow();
                customTitlebar = true;
                break;
        }
    }
    await init()
    session.fromPartition("some-partition").setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === "notifications") {
            // Approves the permissions request
            callback(true);
        }
        if (permission === "media") {
            // Approves the permissions request
            callback(true);
        }
    });
    app.on("activate", async function () {
        if (BrowserWindow.getAllWindows().length === 0)
            await init()
    });
});
