// Modules to control application life and create native browser window
import {app, BrowserWindow, session} from "electron";
import "v8-compile-cache";
import {getConfig, checkIfConfigExists, injectElectronFlags, installModLoader} from "./utils";
import "./extensions/mods";
import "./tray";
import {createCustomWindow, createNativeWindow, createTransparentWindow, mainWindow} from "./window";
import path from "path";
export var iconPath: string;
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
    if ((await getConfig("customIcon")) !== undefined ?? null) {
        iconPath = await getConfig("customIcon");
    } else {
        iconPath = path.join(__dirname, "../", "/assets/ac_icon_transparent.png");
    }
    async function init() {
        switch (await getConfig("windowStyle")) {
            case "default":
                createCustomWindow();
                customTitlebar = true;
                break;
            case "native":
                createNativeWindow();
                break;
            case "transparent":
                createTransparentWindow();
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
    await init();
    await installModLoader()
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
        if (BrowserWindow.getAllWindows().length === 0) await init();
    });
});
