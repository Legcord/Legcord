// Modules to control application life and create native browser window
import {BrowserWindow, app, crashReporter, session} from "electron";
import "v8-compile-cache";
import "./discord/extensions/csp.js";
import "./tray.js";
import fs from "fs";
import {createCustomWindow, createNativeWindow, createTransparentWindow} from "./discord/window.js";
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
import {installModLoader} from "./discord/extensions/mods.js";
export let iconPath: string;
import type {Settings} from "./types/settings";
export let settings: Settings;
export let customTitlebar: boolean;

app.on("render-process-gone", (_event, _webContents, details) => {
    if (details.reason == "crashed") {
        app.relaunch();
    }
});
async function args(): Promise<void> {
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
        await app.whenReady().then(async () => {
            await createTManagerWindow();
        });
    }
}
await args(); // i want my top level awaits - IMPLEMENTED :)
if (!app.requestSingleInstanceLock() && getConfig("multiInstance") == (false ?? undefined)) {
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
    // work around chrome 66 disabling autoplay by default
    app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
    // WinRetrieveSuggestionsOnlyOnDemand: Work around electron 13 bug w/ async spellchecking on Windows.
    // HardwareMediaKeyHandling,MediaSessionService: Prevent Discord from registering as a media service.
    app.commandLine.appendSwitch(
        "disable-features",
        "WinRetrieveSuggestionsOnlyOnDemand,HardwareMediaKeyHandling,MediaSessionService"
    );
    checkForDataFolder();
    checkIfConfigExists();
    checkIfConfigIsBroken();
    injectElectronFlags();
    console.log("[Config Manager] Current config: " + fs.readFileSync(getConfigLocation(), "utf-8"));
    void app.whenReady().then(async () => {
        // REVIEW - Awaiting the line above will cause a hang at startup
        if (getConfig("customIcon") !== null) {
            iconPath = getConfig("customIcon");
        } else {
            iconPath = path.join(import.meta.dirname, "../", "/assets/desktop.png");
        }
        async function init(): Promise<void> {
            if (getConfig("skipSplash") == false) {
                void createSplashWindow(); // REVIEW - Awaiting will hang at start
            }
            if (firstRun == true) {
                setLang(new Intl.DateTimeFormat().resolvedOptions().locale);
                await createSetupWindow(); //NOTE - Untested, awaiting this will probably hang
            }
            switch (getConfig("windowStyle")) {
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
        app.on("activate", function () {
            async () => {
                if (BrowserWindow.getAllWindows().length === 0) await init();
            };
        });
    });
}
