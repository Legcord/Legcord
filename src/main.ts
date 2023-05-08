// Modules to control application life and create native browser window
import {BrowserWindow, app, crashReporter, session} from "electron";
import "v8-compile-cache";
import {
    Settings,
    checkForDataFolder,
    checkIfConfigExists,
    getConfig,
    injectElectronFlags,
    installModLoader,
    setConfig
} from "./utils";
import "./extensions/mods";
import "./tray";
import {createCustomWindow, createNativeWindow, createTransparentWindow} from "./window";
import path from "path";
export let iconPath: string;
export let settings: any;
export let customTitlebar: boolean;
async function args(): Promise<void> {
    let argNum = 2;
    if (process.argv[0] == "electron") argNum++;
    let args = process.argv[argNum];
    if (args == undefined) return;
    if (args.startsWith("--")) return; //electron flag
    if (args.includes("=")) {
        let e = args.split("=");
        await setConfig(e[0] as keyof Settings, e[1]);
        console.log(`Setting ${e[0]} to ${e[1]}`);
        app.relaunch();
        app.exit();
    }
}
args(); // i want my top level awaits
if (!app.requestSingleInstanceLock()) {
    // kill if 2nd instance
    app.quit();
} else {
    // Your data now belongs to CCP
    crashReporter.start({uploadToServer: false});
    /* Using appendSwitch properly causes ArmCord to segfault,
       So we will leave the responsibility of enabling Wayland
       And PipeWire video capture to packagers.
    // We use toLowerCase to account for desktops where XDG_SESSION_TYPE might be Wayland and not wayland.
    if (process.platform === "linux" && process.env.XDG_SESSION_TYPE?.toLowerCase() === "wayland") {
            // Just using the native Wayland backend doesn't enable PipeWire capture, we need to enable it explicitly.
            app.commandLine.appendSwitch("enable-features=WebRTCPipeWireCapturer");
            console.log("Wayland detected, using PipeWire for video capture.");
            // Some people might want to disable the Wayland backend for one reason or another, such as for Wayland-specific bugs.
            if (process.env.USE_WAYLAND === "0") {
                console.log("Wayland backend disabled.");
            } else {
                console.log("Using native Wayland, not Xwayland. Disable with USE_WAYLAND=0 if you find issues.");
                app.commandLine.appendSwitch("ozone-platform=auto");
                // The Wayland spec doesn't require SSDs, so lets enable self-drawn window decorations. 
                // If SSDs are supported on the compositor, Electron will let the compositor handle the decorations.
                app.commandLine.appendSwitch("enable-features=UseOzonePlatform,WaylandWindowDecorations");
              }
        }
    */

    checkForDataFolder();
    checkIfConfigExists();
    injectElectronFlags();
    app.whenReady().then(async () => {
        if ((await getConfig("customIcon")) !== undefined ?? null) {
            iconPath = await getConfig("customIcon");
        } else {
            iconPath = path.join(__dirname, "../", "/assets/ac_icon_transparent.png");
        }
        async function init(): Promise<void> {
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
        session.fromPartition("some-partition").setPermissionRequestHandler((_webContents, permission, callback) => {
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
