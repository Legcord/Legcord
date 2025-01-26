// Modules to control application life and create native browser window
import { BrowserWindow, app, crashReporter, session, systemPreferences } from "electron";
import "./discord/extensions/csp.js";
import "./protocol.js";
import { readFileSync } from "node:fs";
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
import "./updater.js";
import { injectElectronFlags } from "./common/flags.js";
import { setLang } from "./common/lang.js";
import { fetchMods } from "./discord/extensions/modloader.js";
import { createWindow } from "./discord/window.js";
import { createSetupWindow } from "./setup/main.js";
import { createSplashWindow } from "./splash/main.js";
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
    // WinRetrieveSuggestionsOnlyOnDemand: Work around electron 13 bug w/ async spellchecking on Windows.
    // HardwareMediaKeyHandling,MediaSessionService: Prevent Discord from registering as a media service.
    app.commandLine.appendSwitch(
        "disable-features",
        "WidgetLayering,WinRetrieveSuggestionsOnlyOnDemand,HardwareMediaKeyHandling,MediaSessionService",
    ); // fix dev tools layers
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

    app.commandLine.appendSwitch("enable-transparent-visuals");
    checkIfConfigIsBroken();
    injectElectronFlags();
    await fetchMods();
    void import("./discord/extensions/plugin.js"); // load chrome extensions
    console.log(`[Config Manager] Current config: ${readFileSync(getConfigLocation(), "utf-8")}`);

    // OLD CONFIGS MIGRATION
    if (getConfig("hardwareAcceleration") === false) {
        app.disableHardwareAcceleration();
    } else if (getConfig("hardwareAcceleration") === undefined) {
        setConfig("hardwareAcceleration", true); // pre 3.3.0
    }
    if (getConfig("audio") === undefined)
        setConfig("audio", {
            workaround: false,
            deviceSelect: true,
            granularSelect: true,
            ignoreVirtual: false,
            ignoreDevices: false,
            ignoreInputMedia: false,
            onlySpeakers: false,
            onlyDefaultSpeakers: true,
            loopbackType: "loopback",
        });
    if (getConfig("keybinds") === undefined) setConfig("keybinds", []);
    if (getConfig("additionalArguments") === undefined) setConfig("additionalArguments", "");
    if (getConfig("transparency") === undefined) setConfig("transparency", "none");
    if (getConfig("windowStyle") === "transparent") setConfig("windowStyle", "default");
    if (typeof getConfig("tray") === "boolean") {
        //@ts-expect-error
        if (getConfig("tray") === true) {
            setConfig("tray", "dynamic");
            //@ts-expect-error old types
        } else if (getConfig("tray") === false) {
            setConfig("tray", "disabled");
        }
    }
    if (getConfig("additionalArguments") !== undefined)
        app.commandLine.appendArgument(getConfig("additionalArguments"));
    if (getConfig("smoothScroll") === false) app.commandLine.appendSwitch("disable-smooth-scrolling");
    if (getConfig("autoScroll")) app.commandLine.appendSwitch("enable-blink-features", "MiddleClickAutoscroll");
    if (getConfig("disableHttpCache")) app.commandLine.appendSwitch("disable-http-cache");

    void app.whenReady().then(async () => {
        // Patch for linux bug to ensure things are loaded before window creation (fixes transparency on some linux systems)
        await new Promise<void>((resolve) =>
            setTimeout(() => {
                init().then(() => {
                    resolve();
                });
            }, 1500),
        );
        session.defaultSession.setPermissionRequestHandler(async (_webContents, permission, callback) => {
            switch (permission) {
                case "fullscreen":
                case "notifications":
                    callback(true);
                    break;
                case "clipboard-sanitized-write":
                    callback(true);
                    break;
                case "media": {
                    if (process.platform === "darwin") {
                        console.log(`microphone access: ${systemPreferences.getMediaAccessStatus("microphone")}`);
                        console.log(`camera access: ${systemPreferences.getMediaAccessStatus("camera")}`);
                        callback(
                            await new Promise<boolean>((resolve, reject) => {
                                systemPreferences.askForMediaAccess("microphone").then((isGranted) => {
                                    if (!isGranted) {
                                        console.error("Microphone permission rejected by OS");
                                        reject();
                                        return;
                                    }
                                });
                                systemPreferences.askForMediaAccess("camera").then((isGranted) => {
                                    if (!isGranted) {
                                        console.error("Camera permission rejected by OS");
                                        reject();
                                        return;
                                    }
                                });
                                resolve(true);
                            }),
                        );
                    } else {
                        callback(true);
                        break;
                    }
                }
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
