import { app, type ProxyConfig, session } from "electron";
import type { ProxyMode } from "../@types/settings.js";
import { getConfig } from "./config.js";

function envProxy(): string | undefined {
    return process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
}

function envNoProxy(): string | undefined {
    return process.env.NO_PROXY || process.env.no_proxy;
}

/** Convert Chromium-style bypass list to NO_PROXY form. */
function toNoProxy(bypass: string): string {
    return bypass
        .split(/[,;]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            if (part === "<local>") return "localhost,127.0.0.1,::1";
            return part.replace(/^\*\./, ".");
        })
        .join(",");
}

/** Pick a single proxy URL Node fetch can use from Chromium proxyRules. */
function primaryProxyFromRules(rules: string): string | undefined {
    const trimmed = rules.trim();
    if (!trimmed) return undefined;

    // Prefer an explicit https=/http=/socks= mapping, else first token.
    const parts = trimmed
        .split(";")
        .map((p) => p.trim())
        .filter(Boolean);
    for (const scheme of ["https", "http", "socks", "socks5", "socks4"]) {
        const match = parts.find((p) => p.toLowerCase().startsWith(`${scheme}=`));
        if (match) {
            const value = match
                .slice(scheme.length + 1)
                .split(",")[0]
                ?.trim();
            if (value && value !== "direct://") return value.includes("://") ? value : `http://${value}`;
        }
    }

    const first = parts[0]?.split(",")[0]?.trim();
    if (!first || first === "direct://") return undefined;
    if (first.includes("=")) {
        const value = first.split("=")[1]?.trim();
        if (!value || value === "direct://") return undefined;
        return value.includes("://") ? value : `http://${value}`;
    }
    return first.includes("://") ? first : `http://${first}`;
}

function resolveProxyConfig(): ProxyConfig {
    const mode = getConfig("proxyMode") as ProxyMode | undefined;
    const proxyRules = (getConfig("proxyRules") ?? "").trim();
    const proxyBypassRules = (getConfig("proxyBypassRules") ?? "").trim();
    const proxyPacScript = (getConfig("proxyPacScript") ?? "").trim();

    switch (mode) {
        case "direct":
            return { mode: "direct" };
        case "auto_detect":
            return {
                mode: "auto_detect",
                ...(proxyBypassRules ? { proxyBypassRules } : {}),
            };
        case "pac_script":
            return {
                mode: "pac_script",
                pacScript: proxyPacScript,
                ...(proxyBypassRules ? { proxyBypassRules } : {}),
            };
        case "fixed_servers":
            return {
                mode: "fixed_servers",
                proxyRules,
                ...(proxyBypassRules ? { proxyBypassRules } : {}),
            };
        default: {
            // system — also honor HTTP(S)_PROXY so env-based setups work for Chromium
            const fromEnv = envProxy();
            if (fromEnv) {
                return {
                    mode: "fixed_servers",
                    proxyRules: fromEnv,
                    proxyBypassRules: proxyBypassRules || toNoProxy(envNoProxy() ?? "<local>"),
                };
            }
            return {
                mode: "system",
                ...(proxyBypassRules ? { proxyBypassRules } : {}),
            };
        }
    }
}

/**
 * Configure Node.js fetch / http to honor proxy env vars, and sync env from settings
 * when using a fixed proxy. Must run before main-process network (e.g. mod downloads).
 */
export function configureNodeProxyEnv(): void {
    process.env.NODE_USE_ENV_PROXY = "1";

    const mode = (getConfig("proxyMode") as ProxyMode | undefined) ?? "system";

    if (mode === "direct") {
        // Force no proxy for Node fetches
        process.env.HTTP_PROXY = "";
        process.env.HTTPS_PROXY = "";
        process.env.http_proxy = "";
        process.env.https_proxy = "";
        process.env.NO_PROXY = "*";
        process.env.no_proxy = "*";
        console.log("[Proxy] Node fetch: direct (no proxy)");
        return;
    }

    if (mode === "fixed_servers") {
        const rules = (getConfig("proxyRules") ?? "").trim();
        const proxyUrl = primaryProxyFromRules(rules);
        if (proxyUrl) {
            process.env.HTTP_PROXY = proxyUrl;
            process.env.HTTPS_PROXY = proxyUrl;
            process.env.http_proxy = proxyUrl;
            process.env.https_proxy = proxyUrl;
            const bypass = (getConfig("proxyBypassRules") ?? "").trim();
            if (bypass) {
                const noProxy = toNoProxy(bypass);
                process.env.NO_PROXY = noProxy;
                process.env.no_proxy = noProxy;
            }
            console.log(`[Proxy] Node fetch: ${proxyUrl}`);
            return;
        }
    }

    // system / pac / auto_detect — keep existing env (HTTPS_PROXY etc.)
    if (envProxy()) {
        console.log(`[Proxy] Node fetch: using environment proxy (${envProxy()})`);
    } else {
        console.log("[Proxy] Node fetch: no HTTP(S)_PROXY in environment");
    }
}

/**
 * Apply Chromium command-line proxy switches early (before app ready).
 * Session.setProxy still runs later for the authoritative config.
 */
export function applyProxyCommandLineSwitches(): void {
    const mode = (getConfig("proxyMode") as ProxyMode | undefined) ?? "system";
    const proxyRules = (getConfig("proxyRules") ?? "").trim();
    const proxyBypassRules = (getConfig("proxyBypassRules") ?? "").trim();
    const proxyPacScript = (getConfig("proxyPacScript") ?? "").trim();

    if (mode === "direct") {
        app.commandLine.appendSwitch("no-proxy-server");
        return;
    }

    if (mode === "auto_detect") {
        app.commandLine.appendSwitch("proxy-auto-detect");
        if (proxyBypassRules) app.commandLine.appendSwitch("proxy-bypass-list", proxyBypassRules);
        return;
    }

    if (mode === "pac_script" && proxyPacScript) {
        app.commandLine.appendSwitch("proxy-pac-url", proxyPacScript);
        if (proxyBypassRules) app.commandLine.appendSwitch("proxy-bypass-list", proxyBypassRules);
        return;
    }

    if (mode === "fixed_servers" && proxyRules) {
        app.commandLine.appendSwitch("proxy-server", proxyRules);
        if (proxyBypassRules) app.commandLine.appendSwitch("proxy-bypass-list", proxyBypassRules);
        return;
    }

    // system — if HTTPS_PROXY is set, push it to Chromium too
    const fromEnv = envProxy();
    if (fromEnv) {
        app.commandLine.appendSwitch("proxy-server", fromEnv);
        const bypass = proxyBypassRules || toNoProxy(envNoProxy() ?? "<local>");
        app.commandLine.appendSwitch("proxy-bypass-list", bypass);
    }
}

/** Apply proxy to the default session once Electron is ready. */
export async function applySessionProxy(): Promise<void> {
    const config = resolveProxyConfig();
    console.log(`[Proxy] Applying session proxy: ${JSON.stringify(config)}`);
    try {
        await session.defaultSession.setProxy(config);
        await session.defaultSession.closeAllConnections();
    } catch (error) {
        console.error("[Proxy] Failed to apply session proxy:", error);
    }
}
