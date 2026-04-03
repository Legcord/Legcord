import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { platform } from "node:os";
import { dirname, join } from "node:path";
import { app, dialog } from "electron";
import type { Settings } from "../@types/settings.js";
import { getLang } from "./lang.js";
import { getWindowStateLocation } from "./windowState.js";
export let firstRun: boolean;

// Performance optimization: Cache config to avoid reading file on every call
let configCache: Settings | null = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 1000; // Cache for 1 second
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
    windowMaterial: "mica",
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
    vaapi: platform() === "linux",
    spellcheckLanguage: ["en-US"],
    sleepInBackground: false,
    noBundleUpdates: [],
    automaticUpdates: false,
    additionalArguments: "",
    customIcon: join(import.meta.dirname, "../", "/assets/desktop.png"),
    smoothScroll: true,
    autoScroll: false,
    useSystemCssEditor: false,
    extendedPluginAbilities: false,
    quickCss: true,
    supportBannerDismissed: false,
};

const safeMode: Settings = {
    ...defaults,
    mods: [],
    windowStyle: "native",
    hardwareAcceleration: false,
    disableHttpCache: true,
    vaapi: false,
    additionalArguments: "",
    extendedPluginAbilities: false,
    quickCss: false,
};

export function checkForDataFolder(): void {
    const dataPath = join(dirname(app.getPath("exe")), "legcord-data");
    if (existsSync(dataPath) && statSync(dataPath).isDirectory()) {
        console.log("Found legcord-data folder. Running in portable mode.");
        app.setPath("userData", dataPath);
    }
}

export function getConfigLocation(): string {
    const userDataPath = app.getPath("userData");
    const storagePath = join(userDataPath, "/storage/");
    return `${storagePath}settings.json`;
}

export function getConfig<K extends keyof Settings>(object: K): Settings[K] {
    if (process.argv.includes("--safe-mode")) {
        return safeMode[object];
    }

    // Performance optimization: Use cached config if available and fresh
    const now = Date.now();
    if (configCache && now - configCacheTime < CONFIG_CACHE_TTL) {
        return configCache[object];
    }

    const rawData = readFileSync(getConfigLocation(), "utf-8");
    const returnData = JSON.parse(rawData) as Settings;
    configCache = returnData;
    configCacheTime = now;
    return returnData[object];
}
export function setConfig<K extends keyof Settings>(object: K, toSet: Settings[K]): void {
    const rawData = readFileSync(getConfigLocation(), "utf-8");
    const parsed = JSON.parse(rawData) as Settings;
    parsed[object] = toSet;
    const toSave = JSON.stringify(parsed, null, 4);
    writeFileSync(getConfigLocation(), toSave, "utf-8");

    // Performance optimization: Update cache immediately
    configCache = parsed;
    configCacheTime = Date.now();
}
export function setConfigBulk(object: Settings): void {
    let existingData = {};
    try {
        const existingDataBuffer = readFileSync(getConfigLocation(), "utf-8");
        existingData = JSON.parse(existingDataBuffer.toString()) as Settings;
    } catch (_error) {
        // Ignore errors when the file doesn't exist or parsing fails
    }
    // Merge the existing data with the new data
    const mergedData = { ...existingData, ...object };
    // Write the merged data back to the file
    const toSave = JSON.stringify(mergedData, null, 4);
    writeFileSync(getConfigLocation(), toSave, "utf-8");

    // Performance optimization: Update cache immediately
    configCache = mergedData as Settings;
    configCacheTime = Date.now();
}
export function checkIfConfigExists(): void {
    const userDataPath = app.getPath("userData");
    const storagePath = join(userDataPath, "/storage/");
    const settingsFile = `${storagePath}settings.json`;

    if (!existsSync(app.getPath("userData"))) {
        mkdirSync(app.getPath("userData"));
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
        const settingsData = readFileSync(getConfigLocation(), "utf-8");
        const settingsObject = JSON.parse(settingsData) as Settings;

        // Performance optimization: Update cache after validation
        configCache = settingsObject;
        configCacheTime = Date.now();

        let configWasFine = true;
        const settingsKeys = Object.keys(settingsObject) as (keyof Settings)[];
        const defaultKeys = Object.keys(defaults) as (keyof Settings)[];

        const missingKeysInSettings = defaultKeys.filter((key) => !settingsKeys.includes(key));
        configWasFine = missingKeysInSettings.length === 0;

        defaultKeys.forEach((key: keyof Settings) => {
            const valueInSettings = settingsObject[key];
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

        // Performance optimization: Ensure cache is updated after fixes
        if (!configWasFine) {
            const updatedData = readFileSync(getConfigLocation(), "utf-8");
            configCache = JSON.parse(updatedData) as Settings;
            configCacheTime = Date.now();
        }

        console.log(configWasFine ? "Config is fine" : "Config is now fine");
    } catch (e) {
        console.error(e);
        console.log("Detected a corrupted config");
        setup();
        dialog.showErrorBox(getLang("config-corrupted-title"), getLang("config-corrupted-message"));
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
    handleAutomaticUpdates(configCache!);
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

export function handleAutomaticUpdates(settings: Settings): void {
    if (settings.automaticUpdates) {
        require("../updater.js");
    }
}
