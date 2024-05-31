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
    getConfigSync,
    checkForDataFolder,
    checkIfConfigExists,
    checkIfConfigIsBroken,
    getConfig,
    firstRun,
    Settings,
    getConfigLocation
} from "./common/config.js";
import {injectElectronFlags} from "./common/flags.js";
import {setLang} from "./common/lang.js";
import {installModLoader} from "./discord/extensions/mods.js";
export let iconPath: string;
export let settings: any;
export let customTitlebar: boolean;

app.on("render-process-gone", (event, webContents, details) => {
    if (details.reason == "crashed") {
        app.relaunch();
    }
});
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
    } else if (args == "themes") {
        app.whenReady().then(async () => {
            createTManagerWindow();
        });
    }
}
args(); // i want my top level awaits
if (!app.requestSingleInstanceLock() && getConfigSync("multiInstance") == (false ?? undefined)) {
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
    app.whenReady().then(async () => {
        if ((await getConfig("customIcon")) !== undefined ?? null) {
            iconPath = await getConfig("customIcon");
        } else {
            iconPath = path.join(import.meta.dirname, "../", "/assets/desktop.png");
        }
        async function init(): Promise<void> {
            if ((await getConfig("skipSplash")) == false) {
                createSplashWindow();
            }
            if (firstRun == true) {
                await setLang(new Intl.DateTimeFormat().resolvedOptions().locale);
                createSetupWindow();
            }
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
