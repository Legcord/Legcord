import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { app, dialog } from "electron";
import type { Settings } from "../@types/settings.js";
import { getWindowStateLocation } from "./windowState.js";
export let firstRun: boolean;
const defaults: Settings = {
    windowStyle: "default",
    channel: "stable",
    legcordCSP: true,
    minimizeToTray: true,
    keybinds: [],
    audio: "loopbackWithMute",
    multiInstance: false,
    mods: ["vencord"],
    transparency: "none",
    spellcheck: true,
    hardwareAcceleration: true,
    performanceMode: "none",
    skipSplash: false,
    inviteWebsocket: true,
    startMinimized: false,
    tray: true,
    disableHttpCache: false,
    customJsBundle: "https://legcord.app/placeholder.js",
    customCssBundle: "https://legcord.app/placeholder.css",
    disableAutogain: false,
    useLegacyCapturer: false,
    mobileMode: false,
    trayIcon: "dynamic",
    doneSetup: false,
    clientName: "Legcord",
    customIcon: join(import.meta.dirname, "../", "/assets/desktop.png"),
    smoothScroll: true,
    autoScroll: false,
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
    const rawData = readFileSync(getConfigLocation(), "utf-8");
    const returnData = JSON.parse(rawData) as Settings;
    return returnData[object];
}
export function setConfig<K extends keyof Settings>(object: K, toSet: Settings[K]): void {
    const rawData = readFileSync(getConfigLocation(), "utf-8");
    const parsed = JSON.parse(rawData) as Settings;
    parsed[object] = toSet;
    const toSave = JSON.stringify(parsed, null, 4);
    writeFileSync(getConfigLocation(), toSave, "utf-8");
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
}
export function checkIfConfigExists(): void {
    const userDataPath = app.getPath("userData");
    const storagePath = join(userDataPath, "/storage/");
    const settingsFile = `${storagePath}settings.json`;

    if (!existsSync(app.getPath("userData"))) {
        mkdirSync(app.getPath("userData"));
        console.log("Created missing user data folder");
    }

    if (!existsSync(settingsFile)) {
        if (!existsSync(storagePath)) {
            mkdirSync(storagePath);
            console.log("Created missing storage folder");
        }
        console.log("First run of the Legcord. Starting setup.");
        setup();
        firstRun = true;
    } else if (getConfig("doneSetup") === false) {
        console.log("First run of the Legcord. Starting setup.");
        setup();
        firstRun = true;
    } else {
        console.log("Legcord has been run before. Skipping setup.");
    }
}
export function checkIfConfigIsBroken(): void {
    try {
        const settingsData = readFileSync(getConfigLocation(), "utf-8");
        JSON.parse(settingsData);
        console.log("Config is fine");
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
