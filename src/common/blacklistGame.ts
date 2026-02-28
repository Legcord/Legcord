import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { app } from "electron";

export interface RpcBlacklistEntry {
    name: string;
    id: number;
}

let blacklistCache: RpcBlacklistEntry[] | null = null;
let blacklistCacheTime = 0;
const BLACKLIST_CACHE_TTL = 500;

export function getBlacklistLocation(): string {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "storage");
    return path.join(storagePath, "blacklist.json");
}

function ensureStorageDir(): void {
    const loc = getBlacklistLocation();
    const dir = path.dirname(loc);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function normalizeEntry(g: unknown): RpcBlacklistEntry | null {
    if (!g || typeof g !== "object") return null;
    const o = g as Record<string, unknown>;
    const id = Number(o.id);
    const name = typeof o.name === "string" ? o.name : "";
    if (Number.isNaN(id) || !name) return null;
    return { name, id };
}

export function getBlacklist(): RpcBlacklistEntry[] {
    const now = Date.now();
    if (blacklistCache !== null && now - blacklistCacheTime < BLACKLIST_CACHE_TTL) {
        return blacklistCache;
    }
    ensureStorageDir();
    const loc = getBlacklistLocation();
    if (!existsSync(loc)) {
        blacklistCache = [];
        blacklistCacheTime = now;
        return blacklistCache;
    }
    try {
        const raw = readFileSync(loc, "utf-8");
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed)
            ? parsed.map(normalizeEntry).filter((e): e is RpcBlacklistEntry => e !== null)
            : [];
        blacklistCache = list;
        blacklistCacheTime = now;
        return blacklistCache;
    } catch {
        blacklistCache = [];
        blacklistCacheTime = now;
        return blacklistCache;
    }
}

function saveBlacklist(list: RpcBlacklistEntry[]): void {
    ensureStorageDir();
    writeFileSync(getBlacklistLocation(), JSON.stringify(list, null, 4), "utf-8");
    blacklistCache = list;
    blacklistCacheTime = Date.now();
}

export function blacklistGame(name: string, id: number): void {
    const list = getBlacklist();
    const entryId = Number(id);
    const entryName = String(name);
    if (Number.isNaN(entryId) || !entryName) return;
    if (list.some((e) => e.id === entryId)) return;
    saveBlacklist([...list, { name: entryName, id: entryId }]);
}

export function unblacklistGame(id: number): void {
    const list = getBlacklist();
    const entryId = Number(id);
    if (Number.isNaN(entryId)) return;
    saveBlacklist(list.filter((e) => e.id !== entryId));
}
