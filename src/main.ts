// Modules to control application life and create native browser window
import { BrowserWindow, app, crashReporter, session, systemPreferences } from "electron";
import "v8-compile-cache";
import "./discord/extensions/csp.js";
import "./protocol.js";
import fs from "node:fs";
import type { Settings } from "./@types/settings.js";
import {
    checkForDataFolder,
    checkIfConfigExists,
    checkIfConfigIsBroken,
    firstRun,
    getConfig,
    getConfigLocation,
    setConfig,
} from "./common/config.js";
import { injectElectronFlags } from "./common/flags.js";
import { setLang } from "./common/lang.js";
import { fetchMods } from "./discord/extensions/modloader.js";
import { createWindow } from "./discord/window.js";
import { createSetupWindow } from "./setup/main.js";
import { createSplashWindow } from "./splash/main.js";
import { createTManagerWindow } from "./themeManager/main.js";
export let settings: Settings;
checkForDataFolder();
checkIfConfigExists();

app.on("render-process-gone", (_event, _webContents, details) => {
    if (details.reason === "crashed") {
        app.relaunch();
    }
});
function args(): void {
    let argNum = 2;
    if (process.argv[0] === "electron") argNum++;
    const args = process.argv[argNum];
    if (args === undefined) return;
    if (args.startsWith("--")) return; //electron flag
    if (args.includes("=")) {
        const e = args.split("=");
        setConfig(e[0] as keyof Settings, e[1]);
        console.log(`Setting ${e[0]} to ${e[1]}`);
        app.relaunch();
        app.exit();
    } else if (args === "themes") {
        void app.whenReady().then(async () => {
            await createTManagerWindow();
        });
    }
}
export async function init(): Promise<void> {
    if (firstRun === true || undefined) {
        setLang(new Intl.DateTimeFormat().resolvedOptions().locale);
        await createSetupWindow();
    } else {
        if (getConfig("skipSplash") === false) {
            void createSplashWindow(); // NOTE - Awaiting will hang at start
        }
        createWindow();
    }
}
args();
if (!app.requestSingleInstanceLock() && getConfig("multiInstance") === false) {
    // if value isn't set after 3.2.4
    // kill if 2nd instance
    app.quit();
} else {
    app.setAppUserModelId("app.legcord.Legcord");
    app.commandLine.appendSwitch("disable-features", "WidgetLayering"); // fix dev tools layers
    // Your data now belongs to CCP
    crashReporter.start({ uploadToServer: false });
    // enable pulseaudio audio sharing on linux
    if (process.platform === "linux") {
        app.commandLine.appendSwitch("enable-features", "PulseaudioLoopbackForScreenShare");
        app.commandLine.appendSwitch("disable-features", "WebRtcAllowInputVolumeAdjustment");
    }
    // enable webrtc capturer for wayland
    if (process.platform === "linux" && process.env.XDG_SESSION_TYPE?.toLowerCase() === "wayland") {
        app.commandLine.appendSwitch("disable-features", "UseMultiPlaneFormatForSoftwareVideo");
        app.commandLine.appendSwitch("enable-features", "WebRTCPipeWireCapturer");
        console.log("Wayland detected, using PipeWire for video capture.");
    }
    if (process.platform === "darwin") {
        const status = systemPreferences.getMediaAccessStatus("screen");
        console.log(`macOS screenshare permission: ${status}`);
    }
    // work around chrome 66 disabling autoplay by default
    app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
    // WinRetrieveSuggestionsOnlyOnDemand: Work around electron 13 bug w/ async spellchecking on Windows.
    // HardwareMediaKeyHandling,MediaSessionService: Prevent Discord from registering as a media service.
    app.commandLine.appendSwitch(
        "disable-features",
        "WinRetrieveSuggestionsOnlyOnDemand,HardwareMediaKeyHandling,MediaSessionService",
    );
    app.commandLine.appendSwitch("enable-transparent-visuals");
    checkIfConfigIsBroken();
    injectElectronFlags();
    await fetchMods();
    void import("./discord/extensions/plugin.js"); // load chrome extensions
    console.log(`[Config Manager] Current config: ${fs.readFileSync(getConfigLocation(), "utf-8")}`);
    if (getConfig("hardwareAcceleration") === false) {
        app.disableHardwareAcceleration();
    } else if (getConfig("hardwareAcceleration") === undefined) {
        setConfig("hardwareAcceleration", true); // pre 3.3.0
    }
    if (getConfig("audio") === undefined) setConfig("audio", "loopbackWithMute");
    if (getConfig("keybinds") === undefined) setConfig("keybinds", []);
    if (getConfig("trayIcon") === "default") setConfig("trayIcon", "dynamic");
    if (getConfig("transparency") === undefined) setConfig("transparency", "none");
    // @ts-ignore
    if (getConfig("windowStyle") === "transparent") setConfig("windowStyle", "default");
    if (getConfig("smoothScroll") === false) app.commandLine.appendSwitch("disable-smooth-scrolling");
    if (getConfig("autoScroll")) app.commandLine.appendSwitch("enable-blink-features", "MiddleClickAutoscroll");
    if (getConfig("disableHttpCache")) app.commandLine.appendSwitch("disable-http-cache");
    void app.whenReady().then(async () => {
        // Patch for linux bug to insure things are loaded before window creation (fixes transparency on some linux systems)
        await new Promise<void>((resolve) =>
            setTimeout(
                () =>
                    (
                        // biome-ignore lint/style/noCommaOperator: // FIXME - What?
                        init(), resolve(), 1500
                    ),
            ),
        );
        session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
            if (permission === "notifications") {
                // Approves the permissions request
                callback(true);
            }
            if (permission === "media") {
                // Approves the permissions request
                callback(true);
            }
            if (permission === "fullscreen") {
                // Approves the permissions request
                callback(true);
            }
        });
        app.on("activate", () => {
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
