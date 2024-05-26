import {app, dialog} from "electron";
import path from "path";
import fs from "fs";
import {getWindowStateLocation} from "./windowState";
export let firstRun: boolean;
export function checkForDataFolder(): void {
    const dataPath = path.join(path.dirname(app.getPath("exe")), "armcord-data");
    if (fs.existsSync(dataPath) && fs.statSync(dataPath).isDirectory()) {
        console.log("Found armcord-data folder. Running in portable mode.");
        app.setPath("userData", dataPath);
    }
}

export interface Settings {
    // Referenced for detecting a broken config.
    "0"?: string;
    // Referenced once for disabling mod updating.
    noBundleUpdates?: boolean;
    // Only used for external url warning dialog.
    ignoreProtocolWarning?: boolean;
    customIcon: string;
    windowStyle: string;
    channel: string;
    armcordCSP: boolean;
    minimizeToTray: boolean;
    multiInstance: boolean;
    spellcheck: boolean;
    mods: string;
    dynamicIcon: boolean;
    mobileMode: boolean;
    skipSplash: boolean;
    performanceMode: string;
    customJsBundle: RequestInfo | URL;
    customCssBundle: RequestInfo | URL;
    startMinimized: boolean;
    useLegacyCapturer: boolean;
    tray: boolean;
    keybinds: string[];
    inviteWebsocket: boolean;
    disableAutogain: boolean;
    trayIcon: string;
    doneSetup: boolean;
    clientName: string;
}
export function getConfigLocation(): string {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    return `${storagePath}settings.json`;
}
export async function getConfig<K extends keyof Settings>(object: K): Promise<Settings[K]> {
    let rawdata = fs.readFileSync(getConfigLocation(), "utf-8");
    let returndata = JSON.parse(rawdata);
    return returndata[object];
}
export function getConfigSync<K extends keyof Settings>(object: K) {
    let rawdata = fs.readFileSync(getConfigLocation(), "utf-8");
    let returndata = JSON.parse(rawdata);
    return returndata[object];
}
export async function setConfig<K extends keyof Settings>(object: K, toSet: Settings[K]): Promise<void> {
    let rawdata = fs.readFileSync(getConfigLocation(), "utf-8");
    let parsed = JSON.parse(rawdata);
    parsed[object] = toSet;
    let toSave = JSON.stringify(parsed, null, 4);
    fs.writeFileSync(getConfigLocation(), toSave, "utf-8");
}
export async function setConfigBulk(object: Settings): Promise<void> {
    let existingData = {};
    try {
        const existingDataBuffer = fs.readFileSync(getConfigLocation(), "utf-8");
        existingData = JSON.parse(existingDataBuffer.toString());
    } catch (_error) {
        // Ignore errors when the file doesn't exist or parsing fails
    }
    // Merge the existing data with the new data
    const mergedData = {...existingData, ...object};
    // Write the merged data back to the file
    const toSave = JSON.stringify(mergedData, null, 4);
    fs.writeFileSync(getConfigLocation(), toSave, "utf-8");
}
export async function checkIfConfigExists(): Promise<void> {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const settingsFile = `${storagePath}settings.json`;

    if (!fs.existsSync(settingsFile)) {
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath);
            console.log("Created missing storage folder");
        }
        console.log("First run of the ArmCord. Starting setup.");
        setup();
        firstRun = true;
    } else if ((await getConfig("doneSetup")) == false) {
        console.log("First run of the ArmCord. Starting setup.");
        setup();
        firstRun = true;
    } else {
        console.log("ArmCord has been run before. Skipping setup.");
    }
}
export async function checkIfConfigIsBroken(): Promise<void> {
    try {
        let settingsData = fs.readFileSync(getConfigLocation(), "utf-8");
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
        let windowData = fs.readFileSync(getWindowStateLocation(), "utf-8");
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
        customIcon: path.join(import.meta.dirname, "../", "/assets/desktop.png")
    };
    setConfigBulk({
        ...defaults
    });
}
