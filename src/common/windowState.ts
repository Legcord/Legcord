import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import type { WindowState } from "../@types/windowState.js";

// Performance optimization: Cache window state to avoid reading file on every call
let windowStateCache: WindowState | null = null;
let windowStateCacheTime = 0;
const WINDOW_STATE_CACHE_TTL = 5000; // Cache for 5 seconds

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

    // Performance optimization: Update cache immediately
    windowStateCache = object;
    windowStateCacheTime = Date.now();
}

// NOTE - Similar to getConfig, this seems to return a promise when it has no async. Originally Promise<WindowState[K]>

export function getWindowState<K extends keyof WindowState>(object: K): WindowState[K] {
    // Performance optimization: Use cached window state if available
    const now = Date.now();
    if (windowStateCache && now - windowStateCacheTime < WINDOW_STATE_CACHE_TTL) {
        return windowStateCache[object];
    }

    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const settingsFile = `${storagePath}window.json`;
    if (!fs.existsSync(settingsFile)) {
        fs.writeFileSync(settingsFile, "{}", "utf-8");
    }
    const rawData = fs.readFileSync(settingsFile, "utf-8");
    const returnData = JSON.parse(rawData) as WindowState;
    console.log(`[Window state manager] ${JSON.stringify(returnData)}`);

    // Update cache
    windowStateCache = returnData;
    windowStateCacheTime = now;

    return returnData[object];
}
