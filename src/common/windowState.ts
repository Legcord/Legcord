import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import type { WindowState } from "../@types/windowState.js";

let windowStateCache: WindowState | null = null;

export function getWindowStateLocation() {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    return `${storagePath}window.json`;
}

function ensureWindowStateCache(): WindowState {
    if (windowStateCache) return windowStateCache;
    const settingsFile = getWindowStateLocation();
    if (!fs.existsSync(settingsFile)) {
        fs.writeFileSync(settingsFile, "{}", "utf-8");
    }
    const rawData = fs.readFileSync(settingsFile, "utf-8");
    windowStateCache = JSON.parse(rawData) as WindowState;
    return windowStateCache;
}

export function setWindowState(object: WindowState): void {
    const saveFile = getWindowStateLocation();
    const toSave = JSON.stringify(object, null, 4);
    fs.writeFileSync(saveFile, toSave, "utf-8");
    windowStateCache = object;
}

export function getWindowState<K extends keyof WindowState>(object: K): WindowState[K] {
    return ensureWindowStateCache()[object];
}
