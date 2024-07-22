import {app} from "electron";
import path from "path";
import fs from "fs";
import {WindowState} from "../types/windowState";
export function getWindowStateLocation() {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    return `${storagePath}window.json`;
}
export function setWindowState(object: WindowState): void {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const saveFile = `${storagePath}window.json`;
    const toSave = JSON.stringify(object, null, 4);
    fs.writeFileSync(saveFile, toSave, "utf-8");
}

// NOTE - Similar to getConfig, this seems to return a promise when it has no async. Originally Promise<WindowState[K]>

export function getWindowState<K extends keyof WindowState>(object: K): WindowState[K] {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const settingsFile = `${storagePath}window.json`;
    if (!fs.existsSync(settingsFile)) {
        fs.writeFileSync(settingsFile, "{}", "utf-8");
    }
    const rawData = fs.readFileSync(settingsFile, "utf-8");
    const returnData = JSON.parse(rawData) as WindowState;
    console.log(`[Window state manager] ${JSON.stringify(returnData)}`);
    return returnData[object];
}
