import * as fs from "fs";
import {app, dialog} from "electron";
import path from "path";
import {defaultMaxListeners} from "events";
export var firstRun: boolean;
export var isSetup: boolean;
export var contentPath: string;
//utillity functions that are used all over the codebase or just too obscure to be put in the file used in
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
        mods: "cumcord",
        blurType: "acrylic",
        performanceMode: "none",
        inviteWebsocket: true,
        doneSetup: false
    };
    setConfigBulk({
        ...defaults
    });
}

export function getVersion() {
    //to-do better way of doing this
    return "3.1.0";
}
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
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const langConfigFile = storagePath + "lang.json";
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
        const userDataPath = app.getPath("userData");
        const storagePath = path.join(userDataPath, "/storage/");
        const langConfigFile = storagePath + "lang.json";
        let rawdata = fs.readFileSync(langConfigFile, "utf-8");
        let parsed = JSON.parse(rawdata);
        language = parsed["lang"];
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
    return parsed[object];
}
//ArmCord Settings/Storage manager

export interface Settings {
    windowStyle: string;
    channel: string;
    armcordCSP: boolean;
    minimizeToTray: boolean;
    automaticPatches: boolean;
    mods: string;
    performanceMode: string;
    blurType: string;
    inviteWebsocket: boolean;
    doneSetup: boolean;
}
export async function getConfig(object: string) {
    try {
        const userDataPath = app.getPath("userData");
        const storagePath = path.join(userDataPath, "/storage/");
        const settingsFile = storagePath + "settings.json";
        let rawdata = fs.readFileSync(settingsFile, "utf-8");
        let returndata = JSON.parse(rawdata);
        console.log(object + ": " + returndata[object]);
        return returndata[object];
    } catch (e) {
        console.log("Config probably doesn't exist yet. Returning setup value.");
        firstRun = true;
        return "setup";
    }
}
export async function setConfig(object: string, toSet: any) {
    try {
        const userDataPath = app.getPath("userData");
        const storagePath = path.join(userDataPath, "/storage/");
        const settingsFile = storagePath + "settings.json";
        let rawdata = fs.readFileSync(settingsFile, "utf-8");
        let parsed = JSON.parse(rawdata);
        parsed[object] = toSet;
        let toSave = JSON.stringify(parsed);
        fs.writeFileSync(settingsFile, toSave, "utf-8");
    } catch (e) {
        console.log("Config probably doesn't exist yet. Returning setup value.");
        firstRun = true;
        return "setup";
    }
}
export async function setConfigBulk(object: Settings) {
    try {
        const userDataPath = app.getPath("userData");
        const storagePath = path.join(userDataPath, "/storage/");
        const settingsFile = storagePath + "settings.json";
        let toSave = JSON.stringify(object);
        fs.writeFileSync(settingsFile, toSave, "utf-8");
    } catch (e) {
        console.log("Config probably doesn't exist yet. Returning setup value.");
        firstRun = true;
        return "setup";
    }
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
        isSetup = true;
        contentPath = path.join(__dirname, "/content/setup.html");
        if (!contentPath.includes("ts-out")) {
            contentPath = path.join(__dirname, "/ts-out/content/setup.html");
        }
    } else {
        if ((await getConfig("doneSetup")) == false) {
            console.log("First run of the ArmCord. Starting setup.");
            setup();
            isSetup = true;
            contentPath = path.join(__dirname, "/content/setup.html");
            if (!contentPath.includes("ts-out")) {
                contentPath = path.join(__dirname, "/ts-out/content/setup.html");
            }
        } else {
            console.log("ArmCord has been run before. Skipping setup.");
            contentPath = path.join(__dirname, "/content/splash.html");
            if (!contentPath.includes("ts-out")) {
                contentPath = path.join(__dirname, "/ts-out/content/splash.html");
            }
        }
    }
}
