import * as fs from "fs";
import { app, dialog } from "electron";
import path from "path";
export var firstRun: boolean;
export var contentPath: string;
//utility functions that are used all over the codebase or just too obscure to be put in the file used in
export function addStyle(styleString: string) {
    const style = document.createElement("style");
    style.textContent = styleString;
    document.head.append(style);
}

export function addScript(scriptString: string) {
    var script = document.createElement("script");
    script.textContent = scriptString;
    document.body.append(script);
}

export async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function checkIfConfigIsBroken() {
    if ((await getConfig("0")) == "d") {
        console.log("Detected a corrupted config");
        setup();
        dialog.showErrorBox(
            "Oops, something went wrong.",
            "ArmCord has detected that your configuration file is corrupted, please restart the app and set your settings again. If this issue persists, report it on the support server/Github issues."
        );
    }
}

export function setup() {
    console.log("Setting up temporary ArmCord settings.");
    const defaults: Settings = {
        windowStyle: "default",
        channel: "stable",
        armcordCSP: true,
        minimizeToTray: true,
        automaticPatches: false,
        alternativePaste: false,
        mods: "cumcord",
        performanceMode: "none",
        inviteWebsocket: true,
        mobileMode: false,
        trayIcon: "ac_plug_colored",
        doneSetup: false
    };
    setConfigBulk({
        ...defaults
    });
}


//I'm too lazy to replace every mf reference so :p
export function getVersion() {
    //Checks if the version # has 4 sections (3.1.0.0) instead of 3 (3.1.0) / Shitty way to check if Kernel Mod is installed
    if (((app.getVersion()).split('.').length > 3) == true) {
    return app.getVersion().split('.')[0] + "." + app.getVersion().split('.')[1] + "." + app.getVersion().split('.')[2] + " [Kernel Mod]";
} else {
    return app.getVersion();
}}
export async function injectJS(inject: string) {
    const js = await (await fetch(`${inject}`)).text();

    const el = document.createElement("script");

    el.appendChild(document.createTextNode(js));

    document.body.appendChild(el);
}
export async function injectElectronFlags() {
    //     MIT License

    // Copyright (c) 2022 GooseNest

    // Permission is hereby granted, free of charge, to any person obtaining a copy
    // of this software and associated documentation files (the "Software"), to deal
    // in the Software without restriction, including without limitation the rights
    // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    // copies of the Software, and to permit persons to whom the Software is
    // furnished to do so, subject to the following conditions:

    // The above copyright notice and this permission notice shall be included in all
    // copies or substantial portions of the Software.

    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    // SOFTWARE.
    const presets = {
        performance: `--enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist --enable-hardware-overlays=single-fullscreen,single-on-top,underlay --enable-features=EnableDrDc,CanvasOopRasterization,BackForwardCache:TimeToLiveInBackForwardCacheInSeconds/300/should_ignore_blocklists/true/enable_same_site/true,ThrottleDisplayNoneAndVisibilityHiddenCrossOriginIframes,UseSkiaRenderer,WebAssemblyLazyCompilation --disable-features=Vulkan --force_high_performance_gpu`, // Performance
        battery: "--enable-features=TurnOffStreamingMediaCachingOnBattery --force_low_power_gpu" // Known to have better battery life for Chromium?
    };
    switch (await getConfig("performanceMode")) {
        case "performance":
            console.log("Performance mode enabled");
            app.commandLine.appendSwitch(presets.performance);
            break;
        case "battery":
            console.log("Battery mode enabled");
            app.commandLine.appendSwitch(presets.battery);
            break;
        default:
            console.log("No performance modes set");
    }
}
export async function setLang(language: string) {
    const langConfigFile = path.join(app.getPath("userData"), "/storage/") + "lang.json";
    if (!fs.existsSync(langConfigFile)) {
        fs.writeFileSync(langConfigFile, "{}", "utf-8");
    }
    let rawdata = fs.readFileSync(langConfigFile, "utf-8");
    let parsed = JSON.parse(rawdata);
    parsed["lang"] = language;
    let toSave = JSON.stringify(parsed);
    fs.writeFileSync(langConfigFile, toSave, "utf-8");
}
var language: string;
export async function getLang(object: string) {
    if (language == undefined) {
        try {
            const userDataPath = app.getPath("userData");
            const storagePath = path.join(userDataPath, "/storage/");
            const langConfigFile = storagePath + "lang.json";
            let rawdata = fs.readFileSync(langConfigFile, "utf-8");
            let parsed = JSON.parse(rawdata);
            language = parsed["lang"];
        } catch (e) {
            console.log("Language config file doesn't exist. Fallback to English.")
            language = "en-US"
        }
    }
    if (language.length == 2) {
        language = language + "-" + language.toUpperCase();
    }
    var langPath = path.join(__dirname, "../", "/assets/lang/" + language + ".json");
    if (!fs.existsSync(langPath)) {
        langPath = path.join(__dirname, "../", "/assets/lang/en-US.json");
    }
    let rawdata = fs.readFileSync(langPath, "utf-8");
    let parsed = JSON.parse(rawdata);
    if (parsed[object] == undefined) {
        console.log(object + " is undefined in " + language)
        langPath = path.join(__dirname, "../", "/assets/lang/en-US.json");
        rawdata = fs.readFileSync(langPath, "utf-8");
        parsed = JSON.parse(rawdata);
        return parsed[object]
    } else {
        return parsed[object];
    }
}

//ArmCord Window State manager
export interface WindowState {
    width: number;
    height: number;
    isMaximized: boolean;
}
export async function setWindowState(object: WindowState) {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const saveFile = storagePath + "window.json";
    if (!fs.existsSync(saveFile)) {
        fs.writeFileSync(saveFile, "{}", "utf-8");
    }
    let toSave = JSON.stringify(object);
    fs.writeFileSync(saveFile, toSave, "utf-8");
}
export async function getWindowState(object: string) {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const settingsFile = storagePath + "window.json";
    let rawdata = fs.readFileSync(settingsFile, "utf-8");
    let returndata = JSON.parse(rawdata);
    console.log("[Window state manager] " + object + ": " + returndata[object]);
    return returndata[object];
}
//ArmCord Settings/Storage manager

export interface Settings {
    windowStyle: string;
    channel: string;
    armcordCSP: boolean;
    minimizeToTray: boolean;
    automaticPatches: boolean;
    alternativePaste: boolean;
    mods: string;
    mobileMode: boolean,
    performanceMode: string;
    inviteWebsocket: boolean;
    trayIcon: string;
    doneSetup: boolean;
}
export function getConfigLocation() {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    return storagePath + "settings.json";
}
export async function getConfig(object: string) {
    let rawdata = fs.readFileSync(getConfigLocation(), "utf-8");
    let returndata = JSON.parse(rawdata);
    console.log("[Config manager] " + object + ": " + returndata[object]);
    return returndata[object];
}
export async function setConfig(object: string, toSet: any) {
    let rawdata = fs.readFileSync(getConfigLocation(), "utf-8");
    let parsed = JSON.parse(rawdata);
    parsed[object] = toSet;
    let toSave = JSON.stringify(parsed);
    fs.writeFileSync(getConfigLocation(), toSave, "utf-8");
}
export async function setConfigBulk(object: Settings) {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const settingsFile = storagePath + "settings.json";
    let toSave = JSON.stringify(object);
    fs.writeFileSync(settingsFile, toSave, "utf-8");
}
export async function checkIfConfigExists() {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const settingsFile = storagePath + "settings.json";

    if (!fs.existsSync(settingsFile)) {
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath);
            console.log("Created missing storage folder");
        }
        console.log("First run of the ArmCord. Starting setup.");
        setup();
        firstRun = true;
    } else {
        if ((await getConfig("doneSetup")) == false) {
            console.log("First run of the ArmCord. Starting setup.");
            setup();
            firstRun = true;
        } else {
            console.log("ArmCord has been run before. Skipping setup.");
        }
    }
}
