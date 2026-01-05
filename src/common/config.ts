import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { app, dialog } from "electron";
import type { Settings } from "../@types/settings.js";
import { getWindowStateLocation } from "./windowState.js";
export let firstRun: boolean;
const defaults: Settings = {
    windowStyle: "default",
    channel: "stable",
    bounceOnPing: false,
    legcordCSP: true,
    minimizeToTray: true,
    processScanning: true,
    windowsLegacyScanning: false,
    scanInterval: 5000,
    overlayButtonColor: "#121214",
    keybinds: [],
    audio: {
        workaround: false,
        deviceSelect: true,
        granularSelect: true,
        ignoreVirtual: false,
        ignoreDevices: false,
        ignoreInputMedia: false,
        onlySpeakers: false,
        onlyDefaultSpeakers: true,
        loopbackType: "loopback",
    },
    multiInstance: false,
    mods: ["vencord"],
    transparency: "none",
    spellcheck: true,
    hardwareAcceleration: true,
    performanceMode: "none",
    skipSplash: false,
    inviteWebsocket: true,
    startMinimized: false,
    disableHttpCache: false,
    customJsBundle: "https://legcord.app/placeholder.js",
    customCssBundle: "https://legcord.app/placeholder.css",
    disableAutogain: false,
    autoHideMenuBar: true,
    blockPowerSavingInVoiceChat: false,
    useMacSystemPicker: true,
    mobileMode: false,
    tray: "dynamic",
    doneSetup: false,
    popoutPiP: false,
    spellcheckLanguage: ["en-US"],
    sleepInBackground: false,
    noBundleUpdates: false,
    additionalArguments: "",
    customIcon: join(import.meta.dirname, "../", "/assets/desktop.png"),
    smoothScroll: true,
    autoScroll: false,
    useSystemCssEditor: false,
};

const safeMode: Settings = {
    ...defaults,
    mods: [],
    windowStyle: "native",
    hardwareAcceleration: false,
    disableHttpCache: true,
};

export function checkForDataFolder(): void {
    const dataPath = join(dirname(app.getPath("exe")), "legcord-data");
    if (existsSync(dataPath) && statSync(dataPath).isDirectory()) {
        console.log("Found legcord-data folder. Running in portable mode.");
        app.setPath("userData", dataPath);
    }
}

let configCache: undefined | Settings = undefined;
export function getConfigLocation(): string {
    const userDataPath = app.getPath("userData");
    const storagePath = join(userDataPath, "/storage/");
    return `${storagePath}settings.json`;
}
function updateConfigCache() {
    if (configCache) return;
    const rawData = readFileSync(getConfigLocation(), "utf-8");
    configCache = JSON.parse(rawData) as Settings;
}
export function getConfig<K extends keyof Settings>(object: K): Settings[K] {
    if (process.argv.includes("--safe-mode")) {
        return safeMode[object];
    }

    updateConfigCache();
    return configCache![object];
}
export function setConfig<K extends keyof Settings>(object: K, toSet: Settings[K]): void {
    updateConfigCache();
    configCache![object] = toSet;
    const toSave = JSON.stringify(configCache, null, 4);
    writeFileSync(getConfigLocation(), toSave, "utf-8");
}
export function setConfigBulk(object: Settings): void {
    updateConfigCache();
    // Merge the existing data with the new data
    const mergedData = { ...configCache, ...object };
    configCache = mergedData;
    // Write the merged data back to the file
    const toSave = JSON.stringify(mergedData, null, 4);
    writeFileSync(getConfigLocation(), toSave, "utf-8");
}
export function checkIfConfigExists(): void {
    const userDataPath = app.getPath("userData");
    const storagePath = join(userDataPath, "/storage/");
    const settingsFile = `${storagePath}settings.json`;

    if (!existsSync(userDataPath)) {
        mkdirSync(userDataPath);
        console.log("Created missing user data folder");
    }

    try {
        if (!existsSync(settingsFile)) {
            if (!existsSync(storagePath)) {
                mkdirSync(storagePath);
                console.log("Created missing storage folder");
            }
            console.log("First run of the Legcord. Starting setup.");
            setup();
            firstRun = true;
        } else if (!getConfig("doneSetup")) {
            console.log("First run of the Legcord. Starting setup.");
            setup();
            firstRun = true;
        } else {
            console.log("Legcord has been run before. Skipping setup.");
        }
    } catch {
        checkIfConfigIsBroken();
    }
}
export function checkIfConfigIsBroken(): void {
    try {
        updateConfigCache();

        let configWasFine = true;
        const settingsKeys = Object.keys(configCache!) as (keyof Settings)[];
        const defaultKeys = Object.keys(defaults) as (keyof Settings)[];

        const missingKeysInSettings = defaultKeys.filter((key) => !settingsKeys.includes(key));
        configWasFine = missingKeysInSettings.length === 0;

        defaultKeys.forEach((key: keyof Settings) => {
            const valueInSettings = configCache![key];
            const valueInDefaults = defaults[key];
            if (!valueInSettings || !valueInDefaults) return;
            if (typeof valueInDefaults !== typeof valueInSettings) {
                console.log(
                    `Root config ${key} type (${typeof valueInSettings}) differs from default type (${typeof valueInDefaults}). Setting default value...`,
                );
                setConfig(key, valueInDefaults);
                configWasFine = false;
            }
        });

        missingKeysInSettings.forEach((missingKey) => {
            console.log(`Missing config root entry ${missingKey}, setting default config for this entry...`);
            setConfig(missingKey, defaults[missingKey]);
        });

        console.log(configWasFine ? "Config is fine" : "Config is now fine");
    } catch (e) {
        console.error(e);
        console.log("Detected a corrupted config");
        setup();
        dialog.showErrorBox(
            "Oops, something went wrong.",
            "Legcord has detected that your configuration file is corrupted, please restart the app and set your settings again. If this issue persists, report it on the support server/Github issues.",
        );
    }
    try {
        const windowData = readFileSync(getWindowStateLocation(), "utf-8");
        JSON.parse(windowData);
        console.log("Window config is fine");
    } catch (e) {
        console.error(e);
        writeFileSync(getWindowStateLocation(), "{}", "utf-8");
        console.log("Detected a corrupted window config");
    }
}

export function setup(): void {
    console.log("Setting up temporary Legcord settings.");
    setConfigBulk({
        ...defaults,
    });
}

export function setFirstRun(value: boolean): void {
    firstRun = value;
}
