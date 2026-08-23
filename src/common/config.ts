import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { platform } from "node:os";
import { dirname, join } from "node:path";
import { app, dialog } from "electron";
import type { Settings } from "../@types/settings.js";
import { getLang } from "./lang.js";
import { getWindowStateLocation } from "./windowState.js";
export let firstRun: boolean;

let configCache: Settings | null = null;

function ensureConfigCache(): Settings {
    if (configCache) return configCache;
    try {
        const rawData = readFileSync(getConfigLocation(), "utf-8");
        configCache = JSON.parse(rawData) as Settings;
    } catch {
        configCache = {} as Settings;
    }
    return configCache;
}

const defaults: Settings = {
    windowStyle: "overlay",
    channel: "stable",
    bounceOnPing: false,
    csp: "none",
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
    mods: [],
    transparency: "none",
    windowMaterial: "mica",
    spellcheck: true,
    hardwareAcceleration: true,
    sdpH264BaselineRewrite: true,
    performanceMode: "none",
    skipSplash: false,
    inviteWebsocket: true,
    startMinimized: "off",
    disableHttpCache: false,
    customJsBundle: "https://legcord.app/placeholder.js",
    customCssBundle: "https://legcord.app/placeholder.css",
    disableAutogain: false,
    autoHideMenuBar: true,
    blockPowerSavingInVoiceChat: false,
    useMacSystemPicker: false,
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
    proxyMode: "system",
    proxyRules: "",
    proxyBypassRules: "<local>",
    proxyPacScript: "",
    customIcon: join(import.meta.dirname, "../", "/assets/desktop.png"),
    smoothScroll: true,
    autoScroll: false,
    useSystemCssEditor: false,
    extendedPluginAbilities: false,
    quickCss: true,
    supportBannerDismissed: false,
    showExperimentalPluginMenu: false,
    pluginStates: {},
};

const safeMode: Settings = {
    ...defaults,
    mods: [],
    windowStyle: "native",
    csp: "vanilla",
    hardwareAcceleration: false,
    sdpH264BaselineRewrite: false,
    disableHttpCache: true,
    vaapi: false,
    additionalArguments: "",
    extendedPluginAbilities: false,
    showExperimentalPluginMenu: false,
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
export function getEntireConfig(): Settings {
    return ensureConfigCache();
}

export function getConfig<K extends keyof Settings>(object: K): Settings[K] {
    if (process.argv.includes("--safe-mode")) {
        return safeMode[object];
    }

    return ensureConfigCache()[object];
}

const START_MINIMIZED_MODES = new Set<Settings["startMinimized"]>(["off", "minimized", "tray"]);

/** Effective startup window mode (CLI overrides are session-only). */
export function getStartMinimizedMode(): Settings["startMinimized"] {
    if (process.argv.includes("--start-in-tray")) return "tray";
    if (process.argv.includes("--start-minimized")) return "minimized";
    const mode = getConfig("startMinimized");
    return START_MINIMIZED_MODES.has(mode) ? mode : "off";
}

/** True when startup should not show the window normally (skip splash). */
export function isBackgroundStart(): boolean {
    return getStartMinimizedMode() !== "off";
}

function migrateStartMinimized(settingsObject: Record<string, unknown>): boolean {
    const value = settingsObject.startMinimized;
    if (typeof value === "boolean") {
        settingsObject.startMinimized = value ? "tray" : "off";
        console.log(`[Config] Migrated startMinimized boolean → "${settingsObject.startMinimized}"`);
        return true;
    }
    return false;
}
export function setConfig<K extends keyof Settings>(object: K, toSet: Settings[K]): void {
    const parsed = ensureConfigCache();
    parsed[object] = toSet;
    const toSave = JSON.stringify(parsed, null, 4);
    writeFileSync(getConfigLocation(), toSave, "utf-8");
}
export function setConfigBulk(object: Settings): void {
    const existingData = configCache ?? ({} as Settings);
    const mergedData = { ...existingData, ...object };
    configCache = mergedData as Settings;
    const toSave = JSON.stringify(mergedData, null, 4);
    writeFileSync(getConfigLocation(), toSave, "utf-8");
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
        const settingsObject = ensureConfigCache() as Settings & Record<string, unknown>;

        if (migrateStartMinimized(settingsObject)) {
            writeFileSync(getConfigLocation(), JSON.stringify(settingsObject, null, 4), "utf-8");
        }

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
