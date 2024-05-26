// Modules to control application life and create native browser window
import {BrowserWindow, app, crashReporter, session} from "electron";
import "v8-compile-cache";
import "./discord/extensions/csp";
import "./tray";
import fs from "fs";
import {createCustomWindow, createNativeWindow, createTransparentWindow} from "./discord/window";
import path from "path";
import {createTManagerWindow} from "./themeManager/main";
import {createSplashWindow} from "./splash/main";
import {createSetupWindow} from "./setup/main";
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
} from "./common/config";
import {injectElectronFlags} from "./common/flags";
import {setLang} from "./common/lang";
import {installModLoader} from "./discord/extensions/mods";
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
    await checkIfConfigExists();
    checkIfConfigIsBroken();
    await injectElectronFlags();
    console.log("[Config Manager] Current config: " + fs.readFileSync(getConfigLocation(), "utf-8"));
    void app.whenReady().then(async () => {
        // REVIEW - Awaiting the line above will cause a hang at startup
        if ((await getConfig("customIcon")) !== undefined ?? null) {
            iconPath = await getConfig("customIcon");
        } else {
            iconPath = path.join(import.meta.dirname, "../", "/assets/desktop.png");
        }
        async function init(): Promise<void> {
            if ((await getConfig("skipSplash")) == false) {
                void createSplashWindow(); // REVIEW - Awaiting will hang at start
            }
            if (firstRun == true) {
                setLang(new Intl.DateTimeFormat().resolvedOptions().locale);
                void createSetupWindow(); //NOTE - Untested, awaiting this will probably hang
            }
            switch (await getConfig("windowStyle")) {
                case "default":
                    await createCustomWindow();
                    customTitlebar = true;
                    break;
                case "native":
                    await createNativeWindow();
                    break;
                case "transparent":
                    await createTransparentWindow();
                    break;
                default:
                    await createCustomWindow();
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
