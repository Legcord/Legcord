import path from "node:path";
import { Worker } from "node:worker_threads";
import type { GameList, ServerSettings } from "arrpc";
import type { BrowserWindow } from "electron";
import { getConfig } from "../common/config.js";
import { getDetectables } from "../common/detectables.js";
import { navigateTo } from "../common/dom.js";

/** Floor so a bad/zero config value cannot busy-loop the scanner. */
const MIN_SCAN_INTERVAL_MS = 1000;
const DEFAULT_SCAN_INTERVAL_MS = 5000;

let rpcWorker: Worker;
export let processList: GameList[] = [];

export function getRpcServerSettings(): ServerSettings {
    const rawInterval = Number(getConfig("scanInterval"));
    const scanInterval =
        Number.isFinite(rawInterval) && rawInterval >= MIN_SCAN_INTERVAL_MS
            ? Math.floor(rawInterval)
            : DEFAULT_SCAN_INTERVAL_MS;

    return {
        processScanning: Boolean(getConfig("processScanning")),
        windowsLegacyScanning: Boolean(getConfig("windowsLegacyScanning")),
        scanInterval,
    };
}

export function startRPC(window: BrowserWindow) {
    if (rpcWorker) {
        rpcWorker.terminate();
    }
    const rpcPath = path.join(__dirname, "rpc.js");
    const settings = getRpcServerSettings();

    rpcWorker = new Worker(rpcPath, {
        env: {
            ...process.env,
            detectables: JSON.stringify(getDetectables()),
            settings: JSON.stringify(settings),
        },
    });

    rpcWorker.on("online", () => {
        console.log("[arRPC] process started", settings);
        console.log(rpcWorker.threadId);
    });

    rpcWorker.on("message", (message: string) => {
        const json = JSON.parse(message);
        if (json.type === "invite") {
            navigateTo(window, `/invite/${json.code}`);
        } else if (json.type === "activity") {
            console.log("activity pulse");
            console.log(json.data);
            window.webContents.executeJavaScript(`window.legcordRPC.listen(${JSON.stringify(json.data)})`);
        } else if (json.type === "processList") {
            console.log("[arRPC] updating process list");
            console.log(json.data);
            processList = json.data;
        }
    });

    rpcWorker.on("error", (err) => {
        console.error("[arRPC] worker error:", err);
    });

    rpcWorker.on("exit", (code) => {
        console.log("[arRPC] worker exited with code", code);
    });
}

export function stopRPC() {
    if (rpcWorker) {
        rpcWorker.terminate();
        console.log("[arRPC] process terminated");
    }
}

export function refreshProcessList() {
    rpcWorker.postMessage({ message: "refreshProcessList" });
}
