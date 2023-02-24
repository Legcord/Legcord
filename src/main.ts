// Modules to control application life and create native browser window
import {app, BrowserWindow, crashReporter, session} from "electron";
import "v8-compile-cache";
import {
    checkForDataFolder,
    getConfig,
    checkIfConfigExists,
    injectElectronFlags,
    installModLoader,
    getConfigLocation
} from "./utils";
import "./extensions/mods";
import "./tray";
import fs from "fs";
import {createCustomWindow, createNativeWindow, createTransparentWindow, mainWindow} from "./window";
import path from "path";
export var iconPath: string;
export var settings: any;
export var customTitlebar: boolean;
export var clientName: "ArmCord";

if (!app.requestSingleInstanceLock()) {
    // kill if 2nd instance
    app.quit();
} else {
    // Your data now belongs to CCP
    crashReporter.start({uploadToServer: false});
    // We use toLowerCase to account for desktops where XDG_SESSION_TYPE might be Wayland and not wayland.
    if (process.platform.toLowerCase() === "linux" && process.env.XDG_SESSION_TYPE?.toLowerCase() === "wayland") {
            // Just using the native Wayland backend doesn't enable PipeWire capture, we need to enable it explicitly.
            app.commandLine.appendSwitch(enable-features=WebRTCPipeWireCapturer);
            console.log("Wayland detected, using PipeWire for video capture.");
            // Some people might want to disable the Wayland backend for one reason or another, such as for Wayland-specific bugs.
            if (process.env.USE_WAYLAND === "0") {
                console.log("Wayland backend disabled.");
            } else {
                console.log("Using native Wayland, not Xwayland. Disable with USE_WAYLAND=0 if you find issues.");
                app.commandLine.appendSwitch(ozone-platform=auto);
                // The Wayland spec doesn't require SSDs, so lets enable self-drawn window decorations. 
                // If SSDs are supported on the compositor, Electron will let the compositor handle the decorations.
                app.commandLine.appendSwitch(enable-features=UseOzonePlatform,WaylandWindowDecorations);
              }
        }

    checkForDataFolder();
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
        await installModLoader();
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
}
