import { join } from "node:path";
import type { LinkData, Node, PatchBay as PatchBayType } from "@vencord/venmic";
import { app, ipcMain } from "electron";
import { getConfig } from "../common/config.js";
import constPaths from "../shared/consts/paths.js";

export let PatchBay: typeof PatchBayType | undefined;
export let patchBayInstance: PatchBayType | undefined;

export let imported = false;
export let initialized = false;

export let hasPipewirePulse = false;
export let isGlibCxxOutdated = false;

export const DIST_DIR: string = constPaths.DIST_DIR;

export function importVenmic() {
    if (process.platform !== "linux") return;
    if (imported) return;
    imported = true;

    const importPath = join(DIST_DIR, `venmic-${process.arch}.node`);
    console.info(`trying to import ${importPath}`);

    try {
        PatchBay = (require(importPath) as typeof import("@vencord/venmic")).PatchBay;

        hasPipewirePulse = PatchBay.hasPipeWire();
        console.log(`Imported Venmic module. Is PipeWire being used?: ${hasPipewirePulse}`);
    } catch (e) {
        console.error("Failed to import Venmic module", e);
        isGlibCxxOutdated = ((e as Error)?.stack || (e as Error)?.message || "").toLowerCase().includes("glibc");
    }
}

export function obtainVenmic() {
    if (!imported) {
        importVenmic();
    }
    if (PatchBay && !initialized) {
        initialized = true;
        try {
            patchBayInstance = new PatchBay();
        } catch (e) {
            console.error("Failed to instantiate Venmic", e);
        }
    }
    console.log("Obtained Venmic module");
    return patchBayInstance;
}

export function getRendererAudioServicePid() {
    return (
        app
            .getAppMetrics()
            .find((proc) => proc.name === "Audio Service")
            ?.pid?.toString() ?? "unknown"
    );
}

export type venmicListObject =
    | { ok: true; targets: string[]; hasPipewirePulse: boolean }
    | { ok: false; isGlibCxxOutdated: boolean };

export function registerVenmicIpc() {
    if (process.platform !== "linux") return console.info("Client is not Linux");
    console.info("Venmic Node module should be on path", join(DIST_DIR, `venmic-${process.arch}.node`));

    ipcMain.handle("venmicList", () => {
        const audioPid = getRendererAudioServicePid();
        const granularSelect = getConfig("audio").granularSelect;
        const targets = obtainVenmic()
            ?.list(granularSelect ? ["node.name"] : undefined)
            .filter((s) => s["application.process.id"] !== audioPid);

        return targets ? { ok: true, targets, hasPipewirePulse } : { ok: false, isGlibCxxOutdated };
    });

    ipcMain.handle("venmicStart", (_, include: Node[]) => {
        const pid = getRendererAudioServicePid();
        const { ignoreDevices, ignoreInputMedia, ignoreVirtual, workaround } = getConfig("audio") ?? {};

        const data: LinkData = {
            include,
            exclude: [{ "application.process.id": pid }],
            ignore_devices: ignoreDevices ?? false,
        };

        if (ignoreInputMedia ?? true) {
            data.exclude.push({ "media.class": "Stream/Input/Audio" });
        }
        if (ignoreVirtual) {
            data.exclude.push({ "node.virtual": "true" });
        }
        if (workaround) {
            data.workaround = [{ "application.process.id": pid, "media.name": "RecordStream" }];
        }

        return obtainVenmic()?.link(data);
    });

    ipcMain.handle("venmicSystemStart", (_, exclude: Node[]) => {
        const pid = getRendererAudioServicePid();

        const { workaround, ignoreDevices, ignoreInputMedia, ignoreVirtual, onlySpeakers, onlyDefaultSpeakers } =
            getConfig("audio") ?? {};

        const data: LinkData = {
            include: [],
            exclude: [{ "application.process.id": pid }, ...exclude],
            only_speakers: onlySpeakers ?? false,
            ignore_devices: ignoreDevices ?? false,
            only_default_speakers: onlyDefaultSpeakers ?? false,
        };

        if (ignoreInputMedia ?? true) {
            data.exclude.push({ "media.class": "Stream/Input/Audio" });
        }

        if (ignoreVirtual) {
            data.exclude.push({ "node.virtual": "true" });
        }

        if (workaround) {
            data.workaround = [{ "application.process.id": pid, "media.name": "RecordStream" }];
        }

        return obtainVenmic()?.link(data);
    });

    ipcMain.handle("venmicStop", () => obtainVenmic()?.unlink());
}
