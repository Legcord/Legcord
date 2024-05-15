import {app} from "electron";
import path from "path";
import fs from "fs";
export interface WindowState {
    width: number;
    height: number;
    x: number;
    y: number;
    isMaximized: boolean;
}
export function getWindowStateLocation() {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    return `${storagePath}window.json`;
}
export async function setWindowState(object: WindowState): Promise<void> {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const saveFile = `${storagePath}window.json`;
    let toSave = JSON.stringify(object, null, 4);
    fs.writeFileSync(saveFile, toSave, "utf-8");
}
export async function getWindowState<K extends keyof WindowState>(object: K): Promise<WindowState[K]> {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const settingsFile = `${storagePath}window.json`;
    if (!fs.existsSync(settingsFile)) {
        fs.writeFileSync(settingsFile, "{}", "utf-8");
    }
    let rawdata = fs.readFileSync(settingsFile, "utf-8");
    let returndata = JSON.parse(rawdata);
    console.log(`[Window state manager] ${returndata}`);
    return returndata[object];
}
