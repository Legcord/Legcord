import path from "node:path";

/**
 * Resolve a path relative to baseDir, rejecting traversal outside baseDir.
 * Returns null when `relativePath` escapes `baseDir` (or resolves to baseDir itself
 * when `allowBase` is false).
 */
export function resolvePathUnderBaseDir(
    baseDir: string,
    relativePath: string,
    options: { allowBase?: boolean } = {},
): string | null {
    if (typeof relativePath !== "string" || relativePath.includes("\0")) return null;
    const base = path.resolve(baseDir);
    const resolved = path.resolve(base, relativePath);
    const rel = path.relative(base, resolved);
    if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
    if (!options.allowBase && (rel === "" || rel === ".")) return null;
    return resolved;
}

/** Chromium/Electron switches that must not be injectable via additionalArguments. */
export const DANGEROUS_CHROMIUM_SWITCHES = new Set([
    "proxy-server",
    "proxy-pac-url",
    "proxy-auto-detect",
    "proxy-bypass-list",
    "ignore-certificate-errors",
    "ignore-certificate-errors-spki-list",
    "ignore-urlfetcher-cert-requests",
    "allow-insecure-localhost",
    "disable-web-security",
    "host-rules",
    "host-resolver-rules",
    "user-data-dir",
    "data-path",
    "disk-cache-dir",
    "load-extension",
    "disable-extensions-except",
    "remote-debugging-port",
    "remote-debugging-pipe",
    "inspect",
    "inspect-brk",
    "js-flags",
    "renderer-cmd-prefix",
    "utility-cmd-prefix",
    "gpu-launcher",
    "no-sandbox",
    "disable-setuid-sandbox",
]);

/** Strip dangerous Chromium switches from a space-separated additionalArguments string. */
export function sanitizeAdditionalArguments(raw: string): string {
    if (typeof raw !== "string" || raw.length === 0) return "";
    return raw
        .split(/\s+/)
        .filter((arg) => {
            if (!arg.startsWith("--")) return false;
            const key = arg.slice(2).split("=")[0]?.toLowerCase();
            if (!key) return false;
            return !DANGEROUS_CHROMIUM_SWITCHES.has(key);
        })
        .join(" ");
}

/** True when hostname is exactly `domain` or a subdomain of it (case-insensitive). */
export function hostnameMatches(hostname: string, domain: string): boolean {
    const host = hostname.toLowerCase();
    const target = domain.toLowerCase();
    return host === target || host.endsWith(`.${target}`);
}

export function tryParseUrl(urlString: string): URL | null {
    try {
        return new URL(urlString);
    } catch {
        return null;
    }
}

/** True when the frame is a YouTube embed (or Discord Activities YouTube proxy). */
export function isYouTubeEmbedOrProxyFrame(frameUrl: string): boolean {
    const url = tryParseUrl(frameUrl);
    if (!url) return false;

    if (hostnameMatches(url.hostname, "youtube.com") && url.pathname.includes("/embed/")) {
        return true;
    }

    // Discord Activities may proxy YouTube through *.discordsays.com (youtube.com appears in the path/query)
    if (
        hostnameMatches(url.hostname, "discordsays.com") &&
        (url.pathname.includes("youtube.com") || url.search.includes("youtube.com"))
    ) {
        return true;
    }

    return false;
}

/** Telemetry / noise hosts and Discord science endpoints we cancel in webRequest. */
export function isTelemetryBlockedUrl(requestUrl: string): boolean {
    const url = tryParseUrl(requestUrl);
    if (url?.protocol !== "https:") return false;

    if (/^\/api\/v\d+\/science(?:\/|$)/.test(url.pathname)) return true;
    if (hostnameMatches(url.hostname, "sentry.io")) return true;
    if (hostnameMatches(url.hostname, "nel.cloudflare.com")) return true;

    return false;
}

/**
 * Blob downloads for Discord calendar (.ics) use `blob:https://discord.com/<uuid>`.
 * Parse the blob payload URL so `discord.com.evil` / userinfo tricks cannot match.
 */
export function isDiscordIcsBlobUrl(urlString: string): boolean {
    const blobUrl = tryParseUrl(urlString);
    if (blobUrl?.protocol !== "blob:") return false;

    const inner = tryParseUrl(blobUrl.pathname);
    if (!inner || (inner.protocol !== "https:" && inner.protocol !== "http:")) return false;

    return hostnameMatches(inner.hostname, "discord.com");
}

/** Discord stream popout windows (stable / canary / PTB). */
export function isDiscordPopoutUrl(urlString: string): boolean {
    const url = tryParseUrl(urlString);
    if (url?.protocol !== "https:" || url.pathname !== "/popout") return false;

    const host = url.hostname.toLowerCase();
    return host === "discord.com" || host === "canary.discord.com" || host === "ptb.discord.com";
}

const DEFAULT_ALLOWED_LOCALHOST_WS_PORTS = new Set([1211, 1112, 6888]);

/**
 * Block stray localhost WebSocket probes, except known Legcord/local RPC ports.
 * Uses URL parsing instead of substring checks on the raw request URL.
 */
export function isBlockedLocalhostWebSocket(
    requestUrl: string,
    allowedPorts: ReadonlySet<number> = DEFAULT_ALLOWED_LOCALHOST_WS_PORTS,
): boolean {
    const url = tryParseUrl(requestUrl);
    if (!url || (url.protocol !== "ws:" && url.protocol !== "wss:")) return false;
    if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") return false;

    const port = url.port ? Number(url.port) : url.protocol === "wss:" ? 443 : 80;
    if (!Number.isFinite(port)) return true;
    return !allowedPorts.has(port);
}
