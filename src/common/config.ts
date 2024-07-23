import {app, dialog} from "electron";
import path from "path";
import fs from "fs";
import type {Settings} from "../types/settings.d.js";
import {getWindowStateLocation} from "./windowState.js";
export let firstRun: boolean;
export function checkForDataFolder(): void {
    const dataPath = path.join(path.dirname(app.getPath("exe")), "armcord-data");
    if (fs.existsSync(dataPath) && fs.statSync(dataPath).isDirectory()) {
        console.log("Found armcord-data folder. Running in portable mode.");
        app.setPath("userData", dataPath);
    }
}

export function getConfigLocation(): string {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    return `${storagePath}settings.json`;
}
// NOTE - If I remember correctly fs doesn't need async. I have adjusted the Promise<Settings[K]> to reflect so.
// Why touch it when it worked fine? The Async-ness of this function caused headaches in a lot of other places.
// Tested with src/tray.ts - Seems to work great!
// Removed getConfigSync<K extends keyof Settings>(object: K) - Redundant now.
export function getConfig<K extends keyof Settings>(object: K): Settings[K] {
    const rawData = fs.readFileSync(getConfigLocation(), "utf-8");
    const returnData = JSON.parse(rawData) as Settings;
    return returnData[object];
}
export function setConfig<K extends keyof Settings>(object: K, toSet: Settings[K]): void {
    const rawData = fs.readFileSync(getConfigLocation(), "utf-8");
    const parsed = JSON.parse(rawData) as Settings;
    parsed[object] = toSet;
    const toSave = JSON.stringify(parsed, null, 4);
    fs.writeFileSync(getConfigLocation(), toSave, "utf-8");
}
export function setConfigBulk(object: Settings): void {
    let existingData = {};
    try {
        const existingDataBuffer = fs.readFileSync(getConfigLocation(), "utf-8");
        existingData = JSON.parse(existingDataBuffer.toString()) as Settings;
    } catch (error) {
        // Ignore errors when the file doesn't exist or parsing fails
    }
    // Merge the existing data with the new data
    const mergedData = {...existingData, ...object};
    // Write the merged data back to the file
    const toSave = JSON.stringify(mergedData, null, 4);
    fs.writeFileSync(getConfigLocation(), toSave, "utf-8");
}
export function checkIfConfigExists(): void {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const settingsFile = `${storagePath}settings.json`;

    if (!fs.existsSync(app.getPath("userData"))) {
        fs.mkdirSync(app.getPath("userData"));
        console.log("Created missing user data folder");
    }

    if (!fs.existsSync(settingsFile)) {
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath);
            console.log("Created missing storage folder");
        }
        console.log("First run of the ArmCord. Starting setup.");
        setup();
        firstRun = true;
    } else if (getConfig("doneSetup") == false) {
        console.log("First run of the ArmCord. Starting setup.");
        setup();
        firstRun = true;
    } else {
        console.log("ArmCord has been run before. Skipping setup.");
    }
}
export function checkIfConfigIsBroken(): void {
    try {
        const settingsData = fs.readFileSync(getConfigLocation(), "utf-8");
        JSON.parse(settingsData);
        console.log("Config is fine");
    } catch (e) {
        console.error(e);
        console.log("Detected a corrupted config");
        setup();
        dialog.showErrorBox(
            "Oops, something went wrong.",
            "ArmCord has detected that your configuration file is corrupted, please restart the app and set your settings again. If this issue persists, report it on the support server/Github issues."
        );
    }
    try {
        const windowData = fs.readFileSync(getWindowStateLocation(), "utf-8");
        JSON.parse(windowData);
        console.log("Window config is fine");
    } catch (e) {
        console.error(e);
        fs.writeFileSync(getWindowStateLocation(), "{}", "utf-8");
        console.log("Detected a corrupted window config");
    }
}

export function setup(): void {
    console.log("Setting up temporary ArmCord settings.");
    const defaults: Settings = {
        windowStyle: "default",
        channel: "stable",
        armcordCSP: true,
        minimizeToTray: true,
        keybinds: [],
        multiInstance: false,
        mods: "none",
        spellcheck: true,
        performanceMode: "none",
        skipSplash: false,
        inviteWebsocket: true,
        startMinimized: false,
        dynamicIcon: false,
        tray: true,
        customJsBundle: "https://armcord.app/placeholder.js",
        customCssBundle: "https://armcord.app/placeholder.css",
        disableAutogain: false,
        useLegacyCapturer: false,
        mobileMode: false,
        trayIcon: "default",
        doneSetup: false,
        clientName: "ArmCord",
        customIcon: path.join(import.meta.dirname, "../", "/assets/desktop.png"),
        smoothScroll: true,
        autoScroll: false
    };
    setConfigBulk({
        ...defaults
    });
}
