// Modules to control application life and create native browser window
import {BrowserWindow, app, crashReporter, session, systemPreferences} from "electron";
import "v8-compile-cache";
import "./discord/extensions/csp.js";
import "./tray.js";
import "./protocol.js";
import fs from "fs";
import {
    createCustomWindow,
    createNativeWindow,
    createTitlebarOverlayWindow,
    createTransparentWindow
} from "./discord/window.js";
import path from "path";
import {createTManagerWindow} from "./themeManager/main.js";
import {createSplashWindow} from "./splash/main.js";
import {createSetupWindow} from "./setup/main.js";
import {
    setConfig,
    checkForDataFolder,
    checkIfConfigExists,
    checkIfConfigIsBroken,
    getConfig,
    firstRun,
    getConfigLocation
} from "./common/config.js";
import {injectElectronFlags} from "./common/flags.js";
import {setLang} from "./common/lang.js";
export let iconPath: string;
import type {Settings} from "./types/settings.d.js";
import {fetchMods} from "./discord/extensions/modloader.js";
export let settings: Settings;
export let customTitlebar: boolean;
checkForDataFolder();
app.on("render-process-gone", (_event, _webContents, details) => {
    if (details.reason == "crashed") {
        app.relaunch();
    }
});
function args(): void {
    let argNum = 2;
    if (process.argv[0] == "electron") argNum++;
    const args = process.argv[argNum];
    if (args == undefined) return;
    if (args.startsWith("--")) return; //electron flag
    if (args.includes("=")) {
        const e = args.split("=");
        setConfig(e[0] as keyof Settings, e[1]);
        console.log(`Setting ${e[0]} to ${e[1]}`);
        app.relaunch();
        app.exit();
    } else if (args == "themes") {
        void app.whenReady().then(async () => {
            await createTManagerWindow();
        });
    }
}
export async function init(): Promise<void> {
    if (firstRun == true || undefined) {
        setLang(new Intl.DateTimeFormat().resolvedOptions().locale);
        await createSetupWindow();
    } else {
        if (getConfig("skipSplash") == false) {
            void createSplashWindow(); // NOTE - Awaiting will hang at start
        }
        switch (getConfig("windowStyle")) {
            case "default":
                if (["linux", "darwin"].includes(process.platform)) {
                    createCustomWindow();
                } else {
                    // TODO - Bring titlebar overlay to macOS
                    createTitlebarOverlayWindow();
                }
                customTitlebar = true;
                break;
            case "native":
                createNativeWindow();
                break;
            case "transparent":
                createTransparentWindow();
                break;
            default:
                createCustomWindow();
                customTitlebar = true;
                break;
        }
    }
}
args();
if (!app.requestSingleInstanceLock() && getConfig("multiInstance") === false) {
    // if value isn't set after 3.2.4
    // kill if 2nd instance
    app.quit();
} else {
    app.commandLine.appendSwitch("disable-features", "WidgetLayering"); // fix dev tools layers
    // Your data now belongs to CCP
    crashReporter.start({uploadToServer: false});
    // enable pulseaudio audio sharing on linux
    if (process.platform === "linux") {
        app.commandLine.appendSwitch("enable-features", "PulseaudioLoopbackForScreenShare");
        app.commandLine.appendSwitch("disable-features", "WebRtcAllowInputVolumeAdjustment");
    }
    // enable webrtc capturer for wayland
    if (process.platform === "linux" && process.env.XDG_SESSION_TYPE?.toLowerCase() === "wayland") {
        app.commandLine.appendSwitch("enable-features", "WebRTCPipeWireCapturer");
        console.log("Wayland detected, using PipeWire for video capture.");
    }
    if (process.platform === "darwin") {
        const status = systemPreferences.getMediaAccessStatus("screen");
        console.log("macOS screenshare permission: " + status);
    }
    // work around chrome 66 disabling autoplay by default
    app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
    // WinRetrieveSuggestionsOnlyOnDemand: Work around electron 13 bug w/ async spellchecking on Windows.
    // HardwareMediaKeyHandling,MediaSessionService: Prevent Discord from registering as a media service.
    app.commandLine.appendSwitch(
        "disable-features",
        "WinRetrieveSuggestionsOnlyOnDemand,HardwareMediaKeyHandling,MediaSessionService"
    );
    app.commandLine.appendSwitch("enable-transparent-visuals");
    checkIfConfigExists();
    checkIfConfigIsBroken();
    injectElectronFlags();
    await fetchMods();
    void import("./discord/extensions/plugin.js"); // load chrome extensions
    console.log("[Config Manager] Current config: " + fs.readFileSync(getConfigLocation(), "utf-8"));
    if (getConfig("hardwareAcceleration") === false) {
        app.disableHardwareAcceleration();
    } else if (getConfig("hardwareAcceleration") === undefined) {
        setConfig("hardwareAcceleration", true); // pre 3.3.0
    }
    if (getConfig("smoothScroll") === false) {
        app.commandLine.appendSwitch("disable-smooth-scrolling");
    }
    if (getConfig("autoScroll")) {
        app.commandLine.appendSwitch("enable-blink-features", "MiddleClickAutoscroll");
    }
    void app.whenReady().then(async () => {
        // NOTE - Awaiting the line above will cause a hang at startup
        if (getConfig("customIcon") !== null) {
            iconPath = getConfig("customIcon");
        } else {
            iconPath = path.join(import.meta.dirname, "../", "/assets/desktop.png");
        }

        // Patch for linux bug to insure things are loaded before window creation (fixes transparency on some linux systems)
        await new Promise<void>((resolve) => setTimeout(() => (init(), resolve()), 1500));
        session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
            if (permission === "notifications") {
                // Approves the permissions request
                callback(true);
            }
            if (permission === "media") {
                // Approves the permissions request
                callback(true);
            }
        });
        app.on("activate", function () {
            if (BrowserWindow.getAllWindows().length === 0) {
                void init();
            } else {
                BrowserWindow.getAllWindows().forEach((window) => {
                    window.show();
                });
            }
        });
    });
}
