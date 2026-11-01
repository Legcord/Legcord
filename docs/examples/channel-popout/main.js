/**
 * Legcord denies in-app window.open for normal https links and forwards them
 * to shell.openExternal. The renderer opens a marked Discord channel URL, and
 * this patch turns only that marker into a BrowserWindow on the same session.
 * The window uses Legcord's preload, so client mods and Legcord CSS load, then
 * enabled themes are pushed the same way the main window receives them.
 */
const fs = require("node:fs");
const path = require("node:path");

const MARKER = "legcord_channel_popout";

const CHAT_CSS = [
    '[class*="guilds_"] { display: none !important; }',
    '[class*="sidebar_"] { display: none !important; }',
    '[class*="membersWrap_"] { display: none !important; }',
    '[class*="chat_"] {',
    "  flex: 1 1 auto !important;",
    "  min-width: 0 !important;",
    "  max-width: none !important;",
    "}",
].join("\n");

const DISCORD_HOSTS = new Set(["discord.com", "canary.discord.com", "ptb.discord.com", "discordapp.com"]);

function parsePopoutRequest(raw) {
    if (typeof raw !== "string") return null;

    let url;
    try {
        url = new URL(raw);
    } catch {
        return null;
    }

    if (url.protocol !== "https:" || !DISCORD_HOSTS.has(url.hostname.toLowerCase())) return null;
    if (url.searchParams.get(MARKER) !== "1") return null;

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== "channels" || parts.length < 3) return null;

    const guildId = parts[1];
    const channelId = parts[2];
    if (!/^(@me|\d{15,25})$/.test(guildId) || !/^\d{15,25}$/.test(channelId)) return null;

    url.searchParams.delete(MARKER);
    const query = url.searchParams.toString();
    return {
        channelId,
        loadUrl: `${url.origin}${url.pathname}${query ? `?${query}` : ""}${url.hash}`,
    };
}

function popoutChrome(settings, platform) {
    const style = settings.windowStyle ?? "default";
    const transparency = settings.transparency ?? "none";
    const chrome = {
        frame: false,
        backgroundColor: "#313338",
        transparent: false,
    };

    if (style === "default" && platform === "win32") {
        chrome.titleBarStyle = "hidden";
        chrome.titleBarOverlay = false;
    }
    if (style === "overlay") {
        chrome.titleBarStyle = "hidden";
        chrome.titleBarOverlay = {
            color: typeof settings.overlayButtonColor === "string" ? settings.overlayButtonColor : "#121214",
            symbolColor: "#99aab5",
            height: 30,
        };
    }
    if (style === "native") chrome.frame = true;

    if (transparency === "universal") {
        chrome.backgroundColor = "#00000000";
        chrome.transparent = true;
    } else if (transparency === "modern" && platform === "win32") {
        chrome.backgroundColor = "#00000000";
        chrome.frame = true;
        chrome.backgroundMaterial = settings.windowMaterial || "mica";
    } else if (transparency === "modern" && platform === "darwin") {
        chrome.backgroundColor = "#00000000";
        chrome.vibrancy = "fullscreen-ui";
        chrome.transparent = true;
    }

    return chrome;
}

function findPreload(app) {
    const candidates = [
        path.join(process.resourcesPath, "app.asar", "ts-out", "discord", "preload.mjs"),
        path.join(app.getAppPath(), "ts-out", "discord", "preload.mjs"),
        path.join(app.getAppPath(), "discord", "preload.mjs"),
    ];
    return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function readClientSettings(app) {
    try {
        const settingsPath = path.join(app.getPath("userData"), "storage", "settings.json");
        return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    } catch {
        return {};
    }
}

function safeThemeFile(themeDir, relativeFile) {
    if (typeof relativeFile !== "string" || relativeFile.length === 0 || relativeFile.length > 255) return null;
    if (path.isAbsolute(relativeFile)) return null;
    const resolved = path.resolve(themeDir, relativeFile);
    const relative = path.relative(themeDir, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
    return resolved;
}

function collectThemeCss(userData, settings) {
    const themes = [];
    const themesDir = path.join(userData, "themes");
    if (fs.existsSync(themesDir)) {
        for (const id of fs.readdirSync(themesDir)) {
            const dir = path.join(themesDir, id);
            let manifest;
            try {
                if (!fs.statSync(dir).isDirectory()) continue;
                manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
            } catch {
                continue;
            }
            if (!manifest || manifest.enabled !== true) continue;
            const cssPath = safeThemeFile(dir, manifest.theme);
            if (!cssPath || !fs.existsSync(cssPath)) continue;
            try {
                themes.push({ id, css: fs.readFileSync(cssPath, "utf8") });
            } catch {
                // Skip a theme file that disappears mid-read.
            }
        }
    }

    if (settings.quickCss !== false) {
        const quickPath = path.join(userData, "quickCss.css");
        if (fs.existsSync(quickPath)) {
            try {
                themes.push({ id: "legcord-quick-css", css: fs.readFileSync(quickPath, "utf8") });
            } catch {
                // Quick CSS can be locked while the editor saves it.
            }
        }
    }
    return themes;
}

function pushThemes(win, userData, settings, state) {
    if (win.isDestroyed()) return;
    const enabled = collectThemeCss(userData, settings);
    const next = new Set(enabled.map((theme) => theme.id));
    for (const id of state.sent) {
        if (!next.has(id)) win.webContents.send("removeTheme", id);
    }
    for (const theme of enabled) win.webContents.send("addTheme", theme.id, theme.css);
    state.sent = next;
}

function findHostWindow(BrowserWindow, popouts) {
    const wins = BrowserWindow.getAllWindows().filter((win) => !win.isDestroyed() && !popouts.has(win));
    for (const win of wins) {
        try {
            const url = win.webContents.getURL();
            if (url.includes("discord.com") || url.includes("discordapp.com")) return win;
        } catch {
            // A window can already be closing.
        }
    }
    return wins[0] ?? null;
}

function openPopout(api, request) {
    const { BrowserWindow, shell } = api.electron;
    const existing = api.popoutsByChannel.get(request.channelId);
    if (existing && !existing.isDestroyed()) {
        if (existing.isMinimized()) existing.restore();
        existing.show();
        existing.focus();
        return;
    }

    const { app } = api.electron;
    const settings = readClientSettings(app);
    const preload = findPreload(app);
    if (!preload) api.logger.warn("Legcord preload was not found; themes and client mods will not load");

    const host = findHostWindow(BrowserWindow, api.popoutWindows);
    const hostBounds = host?.getBounds();
    const win = new BrowserWindow({
        width: 480,
        height: 760,
        minWidth: 360,
        minHeight: 420,
        ...(hostBounds ? { x: hostBounds.x + 48, y: hostBounds.y + 48 } : {}),
        show: false,
        title: "Discord",
        autoHideMenuBar: true,
        ...popoutChrome(settings, process.platform),
        webPreferences: {
            sandbox: true,
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
            spellcheck: settings.spellcheck !== false,
            ...(preload ? { preload } : {}),
        },
    });

    api.popoutWindows.add(win);
    api.popoutsByChannel.set(request.channelId, win);

    const hostAgent = host && !host.isDestroyed() ? host.webContents.getUserAgent() : "";
    if (hostAgent) win.webContents.setUserAgent(hostAgent);
    if (host && !host.isDestroyed()) {
        const zoom = host.webContents.getZoomFactor();
        if (Number.isFinite(zoom) && zoom > 0) win.webContents.setZoomFactor(zoom);
    }

    const applyChatCss = () => {
        if (!win.isDestroyed()) void win.webContents.insertCSS(CHAT_CSS);
    };
    const themeState = { sent: new Set() };
    const userData = app.getPath("userData");
    const applyThemes = () => pushThemes(win, userData, readClientSettings(app), themeState);

    win.once("ready-to-show", () => {
        if (!win.isDestroyed()) win.show();
    });
    win.webContents.on("dom-ready", applyChatCss);
    win.webContents.on("did-finish-load", applyThemes);
    win.on("focus", applyThemes);
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url === "about:blank") return { action: "allow" };
        try {
            const parsed = new URL(url);
            if (parsed.protocol === "https:" && parsed.pathname === "/popout" && DISCORD_HOSTS.has(parsed.hostname)) {
                return { action: "allow" };
            }
        } catch {
            // Fall through and open the raw value externally.
        }
        void shell.openExternal(url);
        return { action: "deny" };
    });
    win.on("closed", () => {
        api.popoutWindows.delete(win);
        if (api.popoutsByChannel.get(request.channelId) === win) {
            api.popoutsByChannel.delete(request.channelId);
        }
    });

    void win.loadURL(request.loadUrl);
    api.logger.log("opened", request.channelId);
}

function activate(api) {
    const popoutsByChannel = new Map();
    const popoutWindows = new Set();
    api.popoutsByChannel = popoutsByChannel;
    api.popoutWindows = popoutWindows;

    const unpatch = api.patcher.instead("openExternal", api.electron.shell, function (args, original) {
        const request = parsePopoutRequest(args[0]);
        if (!request) return original.apply(this, args);
        try {
            openPopout(api, request);
        } catch (error) {
            api.logger.error("failed to open channel window", error);
            return original.apply(this, args);
        }
        return Promise.resolve();
    });

    api.onCleanup(() => {
        unpatch();
        for (const win of popoutWindows) {
            if (!win.isDestroyed()) win.close();
        }
        popoutWindows.clear();
        popoutsByChannel.clear();
    });

    api.logger.log("main entry active");
}

module.exports.activate = activate;
module.exports.parsePopoutRequest = parsePopoutRequest;
module.exports.popoutChrome = popoutChrome;
module.exports.safeThemeFile = safeThemeFile;
