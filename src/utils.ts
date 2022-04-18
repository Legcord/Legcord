import * as fs from "fs";
import {app, dialog} from "electron";
import path from "path";
export var firstRun: boolean;

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
        doneSetup: false
    };
    setConfigBulk(
        {
            ...defaults,
        },
        
    );
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

//ArmCord Settings/Storage manager
export interface Settings {
    windowStyle: string;
    channel: string;
    armcordCSP: boolean;
    minimizeToTray: boolean;
    automaticPatches: boolean;
    mods: string;
    blurType: string;
    doneSetup: boolean;
}
export async function getConfig(object: string) {
    try {
        const userDataPath = app.getPath("userData");
        const storagePath = path.join(userDataPath, "/storage/");
        let rawdata = fs.readFileSync(storagePath + "settings.json", "utf-8");
        let returndata = JSON.parse(rawdata);
        console.log(returndata[object]);
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
        let rawdata = fs.readFileSync(storagePath + "settings.json", "utf-8");
        let parsed = JSON.parse(rawdata);
        parsed[object] = toSet;
        let toSave = JSON.stringify(parsed)
        fs.writeFileSync(storagePath + "settings.json", toSave, "utf-8")
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
        let toSave = JSON.stringify(object)
        fs.writeFileSync(storagePath + "settings.json", toSave, "utf-8")
    } catch (e) {
        console.log("Config probably doesn't exist yet. Returning setup value.");
        firstRun = true;
        return "setup";
    }
}