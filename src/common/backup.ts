import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { app } from "electron";
import type { Settings } from "../@types/settings.js";
import { setConfigBulk } from "./config.js";

export const LEGCORD_BACKUP_VERSION = 1;
export const MANIFEST_ENTRY = "manifest.json";

export interface BackupIncludeOptions {
    legcordConfig: boolean;
    legcordThemesAndQuickCss: boolean;
    legcordExtensionPlugins: boolean;
    vencordModData: boolean;
    equicordModData: boolean;
    shelterModData: boolean;
    modBundles: boolean;
}

export interface BackupClientMods {
    vencordLocalStorage?: string | null;
    equicordLocalStorage?: string | null;
    shelter?: { plugins: unknown; enabledPlugins: unknown };
}

export interface BackupSavePayload {
    includes: BackupIncludeOptions;
    clientMods: BackupClientMods;
}

export interface BackupManifest extends BackupSavePayload {
    version: typeof LEGCORD_BACKUP_VERSION;
    createdAt: string;
    appVersion: string;
}

export interface BackupPaths {
    userDataPath: string;
    themesPath: string;
    pluginsPath: string;
    pluginStoragePath: string;
    quickCssPath: string;
    getConfigLocation: () => string;
}

function walkFiles(absDir: string, zipPrefix: string): Array<{ name: string; data: Buffer }> {
    if (!existsSync(absDir)) return [];
    const out: Array<{ name: string; data: Buffer }> = [];
    function walk(dir: string): void {
        for (const name of readdirSync(dir)) {
            const full = path.join(dir, name);
            if (statSync(full).isDirectory()) {
                walk(full);
            } else {
                const rel = path.relative(absDir, full);
                const zipName = path.join(zipPrefix, rel).replace(/\\/g, "/");
                out.push({ name: zipName, data: readFileSync(full) });
            }
        }
    }
    walk(absDir);
    return out;
}

function addFileIfExists(entries: Array<{ name: string; data: Buffer }>, diskPath: string, zipName: string): void {
    if (existsSync(diskPath)) {
        entries.push({ name: zipName, data: readFileSync(diskPath) });
    }
}

const BUNDLE_FILES = [
    "vencord.js",
    "vencord.css",
    "equicord.js",
    "equicord.css",
    "shelter.js",
    "custom.js",
    "custom.css",
];

export function buildBackupZipBuffer(payload: BackupSavePayload, paths: BackupPaths): Buffer {
    const includes = payload.includes;
    const clientMods: BackupClientMods = {};

    if (includes.vencordModData) {
        clientMods.vencordLocalStorage = payload.clientMods.vencordLocalStorage ?? null;
    }
    if (includes.equicordModData) {
        clientMods.equicordLocalStorage = payload.clientMods.equicordLocalStorage ?? null;
    }
    if (includes.shelterModData) {
        // @ts-expect-error
        clientMods.shelter = payload.clientMods.shelter;
    }

    const manifest: BackupManifest = {
        version: LEGCORD_BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        appVersion: app.getVersion(),
        includes,
        clientMods,
    };

    const entries: Array<{ name: string; data: Buffer }> = [
        { name: MANIFEST_ENTRY, data: Buffer.from(JSON.stringify(manifest, null, 2), "utf-8") },
    ];

    if (includes.legcordConfig && existsSync(paths.getConfigLocation())) {
        addFileIfExists(entries, paths.getConfigLocation(), "data/storage/settings.json");
    }
    if (includes.legcordThemesAndQuickCss) {
        addFileIfExists(entries, paths.quickCssPath, "data/quickCss.css");
        entries.push(...walkFiles(paths.themesPath, "data/themes"));
    }
    if (includes.legcordExtensionPlugins) {
        entries.push(...walkFiles(paths.pluginsPath, "data/plugins"));
        entries.push(...walkFiles(paths.pluginStoragePath, "data/plugin-storage"));
    }
    if (includes.modBundles) {
        for (const f of BUNDLE_FILES) {
            addFileIfExists(entries, path.join(paths.userDataPath, f), `bundles/${f}`);
        }
    }

    const zip = new AdmZip();
    for (const e of entries) {
        zip.addFile(e.name.replace(/\\/g, "/"), e.data);
    }
    return zip.toBuffer();
}

function writeFileEnsuringDirs(filePath: string, data: Buffer): void {
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, data);
}

/**
 * Resolve a path relative to baseDir, rejecting traversal outside baseDir (zip slip).
 * `relativePath` uses forward slashes as stored in the archive.
 */
function resolvePathUnderBaseDir(baseDir: string, relativePath: string): string | null {
    const base = path.resolve(baseDir);
    const resolved = path.resolve(base, relativePath);
    const rel = path.relative(base, resolved);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
        return null;
    }
    return resolved;
}

/** Apply extracted zip entries to disk. Returns client mod blob for the renderer. */
export function applyBackupFromMap(
    map: Map<string, Buffer>,
    paths: BackupPaths,
): { clientMods: BackupClientMods; manifest: BackupManifest } {
    const raw = map.get(MANIFEST_ENTRY);
    if (!raw) throw new Error("Missing manifest.json");
    const manifest = JSON.parse(raw.toString("utf8")) as BackupManifest;
    if (manifest.version !== LEGCORD_BACKUP_VERSION) {
        throw new Error(`Unsupported backup version: ${String(manifest.version)}`);
    }

    const inc = manifest.includes;

    for (const [name, data] of map) {
        if (name === MANIFEST_ENTRY) continue;

        if (name.startsWith("data/storage/")) {
            if (!inc.legcordConfig) continue;
            const rest = name.slice("data/storage/".length);
            if (rest !== "settings.json") continue;
            const dest = paths.getConfigLocation();
            mkdirSync(path.dirname(dest), { recursive: true });
            setConfigBulk(JSON.parse(data.toString("utf8")) as Settings);
            continue;
        }

        if (name === "data/quickCss.css") {
            if (!inc.legcordThemesAndQuickCss) continue;
            writeFileEnsuringDirs(paths.quickCssPath, data);
            continue;
        }

        if (name.startsWith("data/themes/")) {
            if (!inc.legcordThemesAndQuickCss) continue;
            const rest = name.slice("data/themes/".length);
            const dest = resolvePathUnderBaseDir(paths.themesPath, rest);
            if (!dest) {
                console.warn(`[backup] Skipping unsafe zip path (themes): ${name}`);
                continue;
            }
            writeFileEnsuringDirs(dest, data);
            continue;
        }

        if (name.startsWith("data/plugins/")) {
            if (!inc.legcordExtensionPlugins) continue;
            const rest = name.slice("data/plugins/".length);
            const dest = resolvePathUnderBaseDir(paths.pluginsPath, rest);
            if (!dest) {
                console.warn(`[backup] Skipping unsafe zip path (plugins): ${name}`);
                continue;
            }
            writeFileEnsuringDirs(dest, data);
            continue;
        }

        if (name.startsWith("data/plugin-storage/")) {
            if (!inc.legcordExtensionPlugins) continue;
            const rest = name.slice("data/plugin-storage/".length);
            const dest = resolvePathUnderBaseDir(paths.pluginStoragePath, rest);
            if (!dest) {
                console.warn(`[backup] Skipping unsafe zip path (plugin-storage): ${name}`);
                continue;
            }
            writeFileEnsuringDirs(dest, data);
            continue;
        }

        if (name.startsWith("bundles/")) {
            if (!inc.modBundles) continue;
            const rest = name.slice("bundles/".length);
            if (!BUNDLE_FILES.includes(rest)) continue;
            writeFileEnsuringDirs(path.join(paths.userDataPath, rest), data);
        }
    }

    return { clientMods: manifest.clientMods, manifest };
}

export function readBackupZipToMap(zipBuffer: Buffer): Map<string, Buffer> {
    const zip = new AdmZip(zipBuffer);
    const map = new Map<string, Buffer>();
    for (const entry of zip.getEntries()) {
        if (entry.isDirectory) continue;
        map.set(entry.entryName.replace(/\\/g, "/"), entry.getData());
    }
    return map;
}
