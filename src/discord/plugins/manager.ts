import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { BrowserWindow, app, dialog, ipcMain, shell } from "electron";
import { after, before, instead } from "spitroast/dist/index.mjs";
import { getConfig, setConfig } from "../../common/config.js";
import { VALID_PLUGIN_ID } from "./pluginId.js";

type PluginTarget = "main" | "preload" | "renderer";
type Cleanup = () => void;

interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description?: string;
    author?: string;
    main?: string;
    preload?: string;
    renderer?: string;
    compatibleVersions?: string[];
}

interface PluginRecord {
    manifest: PluginManifest;
    directory: string;
    enabled: boolean;
    compatible: boolean;
    compatibilityMessage?: string;
    loadedMain: boolean;
    cleanups: Cleanup[];
}

interface PluginMainApi {
    id: string;
    manifest: PluginManifest;
    logger: Pick<Console, "log" | "warn" | "error">;
    patcher: {
        before: typeof before;
        after: typeof after;
        instead: typeof instead;
    };
    electron: {
        app: typeof app;
        BrowserWindow: typeof BrowserWindow;
        ipcMain: typeof ipcMain;
        dialog: typeof dialog;
        shell: typeof shell;
    };
    onCleanup: (cleanup: Cleanup) => void;
}

const pluginFolder = path.join(app.getPath("userData"), "/plugins");
const currentLegcordVersion = app.getVersion();
const records = new Map<string, PluginRecord>();
const VALID_ENTRY_PATH = /^[^<>:"|?*\0]+$/;

function getPluginStates() {
    const states = getConfig("pluginStates");
    if (states && typeof states === "object") {
        return states as Record<string, boolean>;
    }
    return {};
}

function setPluginState(pluginId: string, enabled: boolean) {
    const states = getPluginStates();
    states[pluginId] = enabled;
    setConfig("pluginStates", states);
}

function getLogPrefix(id: string) {
    return `[Plugin:${id}]`;
}

function parseManifest(pluginDir: string): PluginManifest | null {
    const manifestPath = path.join(pluginDir, "manifest.json");
    if (!existsSync(manifestPath)) return null;
    try {
        const parsed = JSON.parse(readFileSync(manifestPath, "utf-8")) as PluginManifest;
        if (!parsed.id || !parsed.name || !parsed.version) return null;
        if (!VALID_PLUGIN_ID.test(parsed.id)) {
            console.error(`[Plugin Manager] Invalid plugin id "${parsed.id}"`);
            return null;
        }
        if (typeof parsed.name !== "string" || parsed.name.length > 128) {
            console.error(`[Plugin Manager] ${parsed.id}: invalid plugin name`);
            return null;
        }
        if (typeof parsed.version !== "string" || parsed.version.length > 64) {
            console.error(`[Plugin Manager] ${parsed.id}: invalid plugin version`);
            return null;
        }
        if (
            typeof parsed.main === "undefined" &&
            typeof parsed.preload === "undefined" &&
            typeof parsed.renderer === "undefined"
        ) {
            console.error(`[Plugin Manager] ${parsed.id}: at least one of main/preload/renderer must be defined`);
            return null;
        }
        if (
            (parsed.main && !VALID_ENTRY_PATH.test(parsed.main)) ||
            (parsed.preload && !VALID_ENTRY_PATH.test(parsed.preload)) ||
            (parsed.renderer && !VALID_ENTRY_PATH.test(parsed.renderer))
        ) {
            console.error(`[Plugin Manager] ${parsed.id}: invalid entry path`);
            return null;
        }
        if (
            typeof parsed.compatibleVersions !== "undefined" &&
            (!Array.isArray(parsed.compatibleVersions) ||
                parsed.compatibleVersions.some((version) => typeof version !== "string"))
        ) {
            console.error(`[Plugin Manager] ${parsed.id}: compatibleVersions must be an array of strings`);
            return null;
        }
        return parsed;
    } catch (error) {
        console.error(`[Plugin Manager] Failed to parse manifest in ${pluginDir}`, error);
        return null;
    }
}

function isCompatibleVersion(versionPattern: string, version: string): boolean {
    if (versionPattern === "*" || versionPattern === version) return true;
    if (versionPattern.endsWith(".x")) {
        const prefix = versionPattern.slice(0, -2);
        return version === prefix || version.startsWith(`${prefix}.`);
    }
    return false;
}

function getCompatibility(manifest: PluginManifest): { compatible: boolean; message?: string } {
    const supported = manifest.compatibleVersions;
    if (!supported || supported.length === 0) {
        return { compatible: true };
    }
    const compatible = supported.some((pattern) => isCompatibleVersion(pattern, currentLegcordVersion));
    if (compatible) return { compatible: true };
    return {
        compatible: false,
        message: `Incompatible with Legcord ${currentLegcordVersion} (supports: ${supported.join(", ")})`,
    };
}

function resolvePluginEntry(record: PluginRecord, target: PluginTarget) {
    const entry = record.manifest[target];
    if (!entry) return null;
    const resolved = path.resolve(record.directory, entry);
    const relative = path.relative(record.directory, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
    if (!existsSync(resolved)) return null;
    return resolved;
}

async function loadMain(record: PluginRecord) {
    if (record.loadedMain) return;
    const entry = resolvePluginEntry(record, "main");
    if (!entry) return;

    const loggerPrefix = getLogPrefix(record.manifest.id);
    const api: PluginMainApi = {
        id: record.manifest.id,
        manifest: record.manifest,
        logger: {
            log: (...args) => console.log(loggerPrefix, ...args),
            warn: (...args) => console.warn(loggerPrefix, ...args),
            error: (...args) => console.error(loggerPrefix, ...args),
        },
        patcher: {
            before,
            after,
            instead,
        },
        electron: {
            app,
            BrowserWindow,
            ipcMain,
            dialog,
            shell,
        },
        onCleanup: (cleanup) => {
            record.cleanups.push(cleanup);
        },
    };

    const moduleUrl = `${pathToFileURL(entry).href}?v=${Date.now()}`;
    const mod = (await import(moduleUrl)) as {
        default?: (api: PluginMainApi) => void | Promise<void>;
        activate?: (api: PluginMainApi) => void | Promise<void>;
    };
    const entrypoint = mod.activate ?? mod.default;
    if (typeof entrypoint === "function") {
        await entrypoint(api);
    }
    record.loadedMain = true;
}

function disableMain(record: PluginRecord) {
    if (!record.loadedMain) return;
    for (const cleanup of record.cleanups.splice(0)) {
        try {
            cleanup();
        } catch (error) {
            console.error(`[Plugin Manager] Cleanup failed for ${record.manifest.id}`, error);
        }
    }
    record.loadedMain = false;
}

export async function initializePluginSystem() {
    if (!existsSync(pluginFolder)) {
        mkdirSync(pluginFolder, { recursive: true });
    }

    const discovered: PluginRecord[] = [];
    for (const child of readdirSync(pluginFolder)) {
        const full = path.join(pluginFolder, child);
        const manifest = parseManifest(full);
        if (!manifest) continue;
        const state = getPluginStates();
        const enabled = state[manifest.id] ?? false;
        const compatibility = getCompatibility(manifest);
        discovered.push({
            manifest,
            directory: full,
            enabled,
            compatible: compatibility.compatible,
            ...(compatibility.message !== undefined ? { compatibilityMessage: compatibility.message } : {}),
            loadedMain: false,
            cleanups: [],
        });
    }

    records.clear();
    for (const record of discovered) {
        records.set(record.manifest.id, record);
    }

    for (const record of records.values()) {
        if (!record.enabled || !record.compatible) continue;
        await loadMain(record);
    }
}

export async function setPluginEnabled(pluginId: string, enabled: boolean) {
    const record = records.get(pluginId);
    if (!record) return false;
    if (enabled && !record.compatible) return false;
    setPluginState(pluginId, enabled);
    record.enabled = enabled;
    if (enabled) {
        await loadMain(record);
    } else {
        disableMain(record);
    }
    return true;
}

export async function reloadPlugin(pluginId: string) {
    const record = records.get(pluginId);
    if (!record) return false;
    if (!record.compatible) return false;
    disableMain(record);
    if (record.enabled) {
        await loadMain(record);
    }
    return true;
}

export function listPlugins() {
    return [...records.values()].map((record) => ({
        id: record.manifest.id,
        name: record.manifest.name,
        version: record.manifest.version,
        description: record.manifest.description,
        author: record.manifest.author,
        enabled: record.enabled,
        compatible: record.compatible,
        compatibilityMessage: record.compatibilityMessage,
        compatibleVersions: record.manifest.compatibleVersions ?? [],
        hasMain: Boolean(record.manifest.main),
        hasPreload: Boolean(record.manifest.preload),
        hasRenderer: Boolean(record.manifest.renderer),
    }));
}

export function getRuntimeEntries(target: Exclude<PluginTarget, "main">) {
    return [...records.values()]
        .filter((record) => record.enabled && record.compatible)
        .map((record) => {
            const entry = resolvePluginEntry(record, target);
            if (!entry) return null;
            return {
                id: record.manifest.id,
                name: record.manifest.name,
                path: entry,
            };
        })
        .filter((entry): entry is { id: string; name: string; path: string } => entry !== null);
}

export function getRuntimeScript(pluginId: string, target: Exclude<PluginTarget, "main">) {
    const record = records.get(pluginId);
    if (!record || !record.enabled || !record.compatible) return null;
    const entry = resolvePluginEntry(record, target);
    if (!entry) return null;
    return readFileSync(entry, "utf-8");
}
