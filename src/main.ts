// Modules to control application life and create native browser window
import { BrowserWindow, app, crashReporter, session, systemPreferences } from "electron";
import isDev from "electron-is-dev";
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
    setFirstRun,
    setup,
} from "./common/config.js";
import "./updater.js";
import { getPreset } from "./common/flags.js";
import { setLang } from "./common/lang.js";

// Chrome flags tracking
export interface AppliedFlagsOutput {
    switches: Record<string, string | boolean>;
    enableFeatures: string[];
    disableFeatures: string[];
    enableBlinkFeatures: string[];
    disableBlinkFeatures: string[];
}

const tracker = {
    switches: new Map<string, string | boolean>(),
    enableFeatures: new Set<string>(),
    disableFeatures: new Set<string>(),
    enableBlinkFeatures: new Set<string>(),
    disableBlinkFeatures: new Set<string>(),
};

const trackSwitch = (key: string, value?: string) => tracker.switches.set(key, value ?? true);
const trackEnableFeatures = (features: string[]) => features.forEach((f) => tracker.enableFeatures.add(f));
const trackDisableFeatures = (features: string[]) => features.forEach((f) => tracker.disableFeatures.add(f));
const trackEnableBlinkFeatures = (features: string[]) => features.forEach((f) => tracker.enableBlinkFeatures.add(f));
const trackDisableBlinkFeatures = (features: string[]) => features.forEach((f) => tracker.disableBlinkFeatures.add(f));

export function getAppliedFlags(): AppliedFlagsOutput {
    return {
        switches: Object.fromEntries(tracker.switches),
        enableFeatures: Array.from(tracker.enableFeatures),
        disableFeatures: Array.from(tracker.disableFeatures),
        enableBlinkFeatures: Array.from(tracker.enableBlinkFeatures),
        disableBlinkFeatures: Array.from(tracker.disableBlinkFeatures),
    };
}

import { fetchMods } from "./discord/extensions/modloader.js";
import { createWindow } from "./discord/window.js";
import { createSetupWindow } from "./setup/main.js";
import { createSplashWindow } from "./splash/main.js";
export let settings: Settings;
export let bypassSetup = false;
checkForDataFolder();
checkIfConfigExists();
app.setAsDefaultProtocolClient("discord");
app.on("render-process-gone", (_event, _webContents, details) => {
    if (details.reason === "crashed") {
        app.relaunch();
    }
});
function args(): void {
    // check for bypass-setup flag
    if (process.argv.includes("--bypass-setup")) {
        console.log("Bypassing setup and generating default config...");
        setup(); // default settings
        setConfig("doneSetup", true);
        setFirstRun(false);
        bypassSetup = true;
        return;
    }

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
    // Skip setup if bypass flag was used
    if (bypassSetup || !(firstRun === true || undefined)) {
        if (getConfig("skipSplash") === false) {
            void createSplashWindow(); // NOTE - Awaiting will hang at start
        }
        createWindow();
    } else {
        setLang(new Intl.DateTimeFormat().resolvedOptions().locale);
        await createSetupWindow();
    }
}
args();
if (!app.requestSingleInstanceLock() && getConfig("multiInstance") === false) {
    // if value isn't set after 3.2.4
    // kill if 2nd instance
    app.quit();
} else {
    app.setAppUserModelId("app.legcord.Legcord");

    const enableFeatures = new Set(app.commandLine.getSwitchValue("enable-features").split(","));
    const disableFeatures = new Set(app.commandLine.getSwitchValue("disable-features").split(","));
    const enableBlinkFeatures = new Set(app.commandLine.getSwitchValue("enable-blink-features").split(","));
    const disableBlinkFeatures = new Set(app.commandLine.getSwitchValue("disable-blink-features").split(","));
    // unneeded as the last switch is the applied one, however cleans up the commandline
    app.commandLine.removeSwitch("enable-features");
    app.commandLine.removeSwitch("disable-features");
    app.commandLine.removeSwitch("enable-blink-features");
    app.commandLine.removeSwitch("disable-blink-features");

    // WinRetrieveSuggestionsOnlyOnDemand: Work around electron 13 bug w/ async spellchecking on Windows.
    // HardwareMediaKeyHandling,MediaSessionService: Prevent Discord from registering as a media service.
    disableFeatures
        .add("WidgetLayering")
        .add("WinRetrieveSuggestionsOnlyOnDemand")
        .add("HardwareMediaKeyHandling")
        .add("MediaSessionService");
    // Your data now belongs to CCP
    crashReporter.start({ uploadToServer: false });
    // enable pulseaudio audio sharing on linux
    if (process.platform === "linux") {
        app.commandLine.appendSwitch("gtk-version", "3");
        trackSwitch("gtk-version", "3");
        enableFeatures.add("PulseaudioLoopbackForScreenShare");
        disableFeatures.add("WebRtcAllowInputVolumeAdjustment");
        app.commandLine.appendSwitch("enable-speech-dispatcher");
        trackSwitch("enable-speech-dispatcher");
    }
    // enable webrtc capturer for wayland
    if (process.platform === "linux" && process.env.XDG_SESSION_TYPE?.toLowerCase() === "wayland") {
        enableFeatures.add("WebRTCPipeWireCapturer");
        disableFeatures.add("UseMultiPlaneFormatForSoftwareVideo");
        console.log("Wayland detected, using PipeWire for video capture.");
    }
    if (process.platform === "darwin") {
        const status = systemPreferences.getMediaAccessStatus("screen");
        console.log(`macOS screenshare permission: ${status}`);
    }
    // work around chrome 66 disabling autoplay by default
    app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
    trackSwitch("autoplay-policy", "no-user-gesture-required");

    app.commandLine.appendSwitch("enable-transparent-visuals");
    trackSwitch("enable-transparent-visuals");
    checkIfConfigIsBroken();
    const preset = getPreset();
    if (preset) {
        preset.switches.forEach(([key, val]) => {
            app.commandLine.appendSwitch(key, val);
            trackSwitch(key, val);
        });
        preset.enableFeatures.forEach((val) => enableFeatures.add(val));
        preset.disableFeatures.forEach((val) => disableFeatures.add(val));
    }
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
    if (getConfig("windowStyle") === "rebrand") setConfig("windowStyle", "default");
    if (typeof getConfig("tray") === "boolean") {
        //@ts-expect-error
        if (getConfig("tray") === true) {
            setConfig("tray", "dynamic");
            //@ts-expect-error old types
        } else if (getConfig("tray") === false) {
            setConfig("tray", "disabled");
        }
    }
    if (getConfig("additionalArguments") !== undefined) {
        for (const arg of getConfig("additionalArguments").split(" ")) {
            if (arg.startsWith("--")) {
                const [key, ...rest] = arg.substring(2).split("=");
                const val = rest.length > 0 ? rest.join("=") : undefined;
                if (val === undefined) {
                    app.commandLine.appendSwitch(key);
                    trackSwitch(key);
                } else {
                    if (key === "enable-features") {
                        const flags = val.split(",");
                        flags.forEach((flag) => enableFeatures.add(flag));
                    } else if (key === "disable-features") {
                        const flags = val.split(",");
                        flags.forEach((flag) => disableFeatures.add(flag));
                    } else if (key === "enable-blink-features") {
                        const flags = val.split(",");
                        flags.forEach((flag) => enableBlinkFeatures.add(flag));
                    } else if (key === "disable-blink-features") {
                        const flags = val.split(",");
                        flags.forEach((flag) => disableBlinkFeatures.add(flag));
                    } else {
                        app.commandLine.appendSwitch(key, val);
                        trackSwitch(key, val);
                    }
                }
            }
        }
    }
    if (getConfig("smoothScroll") === false) {
        app.commandLine.appendSwitch("disable-smooth-scrolling");
        trackSwitch("disable-smooth-scrolling");
    }
    if (getConfig("autoScroll")) enableBlinkFeatures.add("MiddleClickAutoscroll");
    if (getConfig("disableHttpCache")) {
        app.commandLine.appendSwitch("disable-http-cache");
        trackSwitch("disable-http-cache");
    }

    enableFeatures.delete("");
    disableFeatures.delete("");
    enableBlinkFeatures.delete("");
    disableBlinkFeatures.delete("");
    if (enableFeatures.size > 0) {
        const featuresStr = Array.from(enableFeatures).join(",");
        app.commandLine.appendSwitch("enable-features", featuresStr);
        trackEnableFeatures(Array.from(enableFeatures));
    }
    if (disableFeatures.size > 0) {
        const featuresStr = Array.from(disableFeatures).join(",");
        app.commandLine.appendSwitch("disable-features", featuresStr);
        trackDisableFeatures(Array.from(disableFeatures));
    }
    if (enableBlinkFeatures.size > 0) {
        const featuresStr = Array.from(enableBlinkFeatures).join(",");
        app.commandLine.appendSwitch("enable-blink-features", featuresStr);
        trackEnableBlinkFeatures(Array.from(enableBlinkFeatures));
    }
    if (disableBlinkFeatures.size > 0) {
        const featuresStr = Array.from(disableBlinkFeatures).join(",");
        app.commandLine.appendSwitch("disable-blink-features", featuresStr);
        trackDisableBlinkFeatures(Array.from(disableBlinkFeatures));
    }

    void app.whenReady().then(async () => {
        if (isDev) console.log(JSON.stringify(getAppliedFlags()));
        process.on("SIGINT", () => app.quit());
        process.on("SIGTERM", () => app.quit());
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
