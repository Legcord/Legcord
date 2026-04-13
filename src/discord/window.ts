import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import os from "node:os";
import path, { join } from "node:path";
import {
    BrowserWindow,
    type BrowserWindowConstructorOptions,
    type DownloadItem,
    type MessageBoxOptions,
    type Session,
    type WebContents,
    app,
    dialog,
    nativeImage,
    shell,
} from "electron";
import contextMenu from "electron-context-menu";
import isDev from "electron-is-dev";
import { firstRun, getConfig, setConfig } from "../common/config.js";
import { navigateTo } from "../common/dom.js";
import { forceQuit, setForceQuit } from "../common/forceQuit.js";
import { getLang } from "../common/lang.js";
import { injectThemesMain } from "../common/themes.js";
import { getWindowState, setWindowState } from "../common/windowState.js";
import { init } from "../main.js";
import {
    type DeepLinkCapable,
    DownloadManagerFactory,
    type DownloadManagerTaskOptions,
    GopeedDownloadManager,
    IDMDownloadManager,
} from "./downloadManager.js";
import { registerGlobalKeybinds } from "./globalKeybinds.js";
import { registerIpc } from "./ipc.js";
import { setMenu } from "./menu.js";
import { startRPC, stopRPC } from "./rpcProcess.js";
import { registerCustomHandler } from "./screenshare.js";
import { mainTouchBar } from "./touchbar.js";
import { createTray, tray } from "./tray.js";
import { registerVenmicIpc } from "./venmic.js";
export let mainWindows: BrowserWindow[] = [];
export let inviteWindow: BrowserWindow;
let downloadManagerHandlerRegistered = false;
const bypassUrls = new Set<string>();
const BYPASS_URLS_MAX = 256;
const ROUTE_CACHE_MAX = 512;
const routeCache = new Map<string, boolean>();
const DISCORD_DOWNLOAD_HOSTS = new Set(["cdn.discordapp.com", "cdn.discordapp.net", "media.discordapp.net"]);
const DOWNLOAD_FILENAME_QUERY_KEYS = ["filename", "file", "name"];

function isHttpUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.startsWith("http://") || lowerUrl.startsWith("https://");
}

function getActiveDownloadManager(): "default" | "gopeed" | "idm" {
    const downloadManager = getConfig("downloadManager") as unknown;
    if (downloadManager === "gopeed" || downloadManager === "idm") {
        return downloadManager;
    }
    return "default";
}

function isDownloadManagerEnabled(): boolean {
    return getActiveDownloadManager() !== "default";
}

function getDownloadUrl(item: DownloadItem): string {
    const chain = item.getURLChain();
    return chain.at(-1) ?? item.getURL();
}

function getRelevantQueryFilename(searchParams: URLSearchParams): string {
    for (const key of DOWNLOAD_FILENAME_QUERY_KEYS) {
        const value = searchParams.get(key);
        if (value) {
            return value;
        }
    }
    return "";
}

function bringGopeedToFront(): void {
    const manager = new GopeedDownloadManager();
    void manager.bringToFront();
}

function bringIDMToFront(): void {
    const manager = new IDMDownloadManager();
    void manager.bringToFront();
}

function rememberBypassUrl(url: string): void {
    if (bypassUrls.has(url)) {
        bypassUrls.delete(url);
    }
    bypassUrls.add(url);
    if (bypassUrls.size > BYPASS_URLS_MAX) {
        const oldest = bypassUrls.values().next().value;
        if (oldest) {
            bypassUrls.delete(oldest);
        }
    }
}

function getCachedRouteDecision(url: string): boolean {
    const cached = routeCache.get(url);
    if (cached !== undefined) {
        routeCache.delete(url);
        routeCache.set(url, cached);
        return cached;
    }

    const shouldRoute = computeRouteDecision(url);
    routeCache.set(url, shouldRoute);
    if (routeCache.size > ROUTE_CACHE_MAX) {
        const oldest = routeCache.keys().next().value;
        if (oldest) {
            routeCache.delete(oldest);
        }
    }

    return shouldRoute;
}

async function buildDownloadRequestHeaders(passedWindow: BrowserWindow, url: string): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    const userAgent = passedWindow.webContents.userAgent;
    if (typeof userAgent === "string" && userAgent.length > 0) {
        headers["User-Agent"] = userAgent;
    }

    const currentUrl = passedWindow.webContents.getURL();
    if (isHttpUrl(currentUrl)) {
        headers.Referer = currentUrl;
    }

    try {
        const cookies = await passedWindow.webContents.session.cookies.get({ url });
        if (cookies.length > 0) {
            headers.Cookie = cookies
                .map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`)
                .join("; ");
        }
    } catch {
        // best-effort header collection
    }

    return headers;
}

async function queueDownloadToManager(
    passedWindow: BrowserWindow,
    url: string,
    managerType: "gopeed" | "idm",
    filename?: string,
): Promise<boolean> {
    try {
        const manager = DownloadManagerFactory.create(managerType);
        if (!manager) {
            console.error(`Download manager "${managerType}" not available on this platform`);
            return false;
        }

        // Check if manager can handle this URL
        const canHandle = await manager.canCreateTask(url);
        if (!canHandle) {
            console.error(`Download manager "${managerType}" cannot handle URL: ${url}`);
            return false;
        }

        const headers = await buildDownloadRequestHeaders(passedWindow, url);
        const taskOptions: DownloadManagerTaskOptions = { filename, headers };

        if (isDev) {
            console.debug(
                `[${managerType.toUpperCase()}] Queueing download: ${url}${filename ? ` as ${filename}` : ""}`,
            );
        }

        // Try deep link if supported (Gopeed optimization)
        if (manager instanceof GopeedDownloadManager && manager.canUseDeepLink()) {
            try {
                const deepLink = manager.createDeepLink(url, headers, filename);
                await shell.openExternal(deepLink);
                if (isDev) console.debug(`[${managerType.toUpperCase()}] Used deep link`);
                return true;
            } catch {
                // Fallback to REST API below
                if (isDev) console.debug(`[${managerType.toUpperCase()}] Deep link failed, falling back to REST`);
            }
        }

        // Standard task creation
        await manager.createTask(url, taskOptions);
        if (isDev) console.debug(`[${managerType.toUpperCase()}] Download queued successfully`);

        // Bring manager window to front
        await manager.bringToFront();

        return true;
    } catch (error) {
        console.error(`Failed to queue download to ${managerType}:`, error);
        return false;
    }
}

function pickGopeedWindow(webContents: WebContents): BrowserWindow | null {
    const ownerWindow = BrowserWindow.fromWebContents(webContents);
    if (ownerWindow && !ownerWindow.isDestroyed()) {
        return ownerWindow;
    }

    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow && !focusedWindow.isDestroyed()) {
        return focusedWindow;
    }

    return mainWindows.find((window) => !window.isDestroyed()) ?? null;
}

function registerDownloadManagerHandler(session: Session): void {
    if (downloadManagerHandlerRegistered) {
        return;
    }

    downloadManagerHandlerRegistered = true;
    session.on("will-download", (event, item, webContents) => {
        const sourceUrl = getDownloadUrl(item);
        if (!sourceUrl) {
            return;
        }

        if (bypassUrls.has(sourceUrl)) {
            bypassUrls.delete(sourceUrl);
            return;
        }

        if (!isDownloadManagerEnabled()) {
            return;
        }

        if (!isHttpUrl(sourceUrl)) {
            return;
        }

        event.preventDefault();
        item.cancel();

        void (async () => {
            try {
                const targetWindow = pickGopeedWindow(webContents);
                if (!targetWindow) {
                    throw new Error("No available BrowserWindow for download manager routing");
                }

                const manager = getActiveDownloadManager();
                const queued = await queueDownloadToManager(targetWindow, sourceUrl, manager, item.getFilename());
                if (!queued) {
                    rememberBypassUrl(sourceUrl);
                    if (!webContents.isDestroyed()) {
                        try {
                            await shell.openExternal(sourceUrl);
                        } catch (error) {
                            console.error("Failed to open default browser for download fallback:", error);
                            webContents.downloadURL(sourceUrl);
                        }
                    }
                    return;
                }
            } catch {
                rememberBypassUrl(sourceUrl);
                if (!webContents.isDestroyed()) {
                    webContents.downloadURL(sourceUrl);
                }
            }
        })();

        return;
    });
}

function computeRouteDecision(url: string): boolean {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();
        const lowerPath = parsed.pathname.toLowerCase();

        if (lowerPath.includes("/attachments/") || DISCORD_DOWNLOAD_HOSTS.has(hostname)) {
            return true;
        }

        if (
            parsed.searchParams.has("download") ||
            parsed.searchParams.has("response-content-disposition") ||
            getRelevantQueryFilename(parsed.searchParams).length > 0
        ) {
            return true;
        }

        return false;
    } catch {
        return false;
    }
}

contextMenu({
    showSaveImageAs: true,
    showCopyImageAddress: true,
    showSearchWithGoogle: false,
    prepend: (_defaultActions, parameters) => [
        {
            label: getLang("contextMenu-searchGoogle"),
            // Only show it when right-clicking text
            visible: parameters.selectionText.trim().length > 0,
            click: () => {
                void shell.openExternal(`https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}`);
            },
        },
        {
            label: getLang("contextMenu-searchDuckDuckGo"),
            // Only show it when right-clicking text
            visible: parameters.selectionText.trim().length > 0,
            click: () => {
                void shell.openExternal(`https://duckduckgo.com/?q=${encodeURIComponent(parameters.selectionText)}`);
            },
        },
    ],
});
function doAfterDefiningTheWindow(passedWindow: BrowserWindow): void {
    const openExternalWithReason = (url: string): void => {
        void shell.openExternal(url);
    };

    createTray();
    if (getWindowState("isMaximized") ?? false) {
        passedWindow.setSize(835, 600); //just so the whole thing doesn't cover whole screen
        passedWindow.maximize();
        void passedWindow.webContents.executeJavaScript(`document.body.setAttribute("isMaximized", "");`);
        passedWindow.hide(); // please don't flashbang the user
    }

    // REVIEW - Test the protocol warning. I was not sure how to get it to pop up. For now I've voided the promises.

    const ignoreProtocolWarning = getConfig("ignoreProtocolWarning");
    registerIpc(passedWindow);
    registerVenmicIpc();
    if (getConfig("mobileMode")) {
        passedWindow.webContents.userAgent =
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.149 Mobile Safari/537.36";
    } else {
        let osType = process.platform === "darwin" ? "Macintosh" : process.platform === "win32" ? "Windows" : "Linux";
        if (osType === "Linux") osType = `X11; ${osType}`;
        const chromeVersion = process.versions.chrome;
        const userAgent = `Mozilla/5.0 (${osType} ${os.arch()}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
        passedWindow.webContents.userAgent = userAgent;
    }
    if (mainWindows.length === 1) {
        app.on("second-instance", (_event, commandLine, _workingDirectory, additionalData) => {
            void (async () => {
                // Print out data received from the second instance.
                console.log(additionalData);

                if (!getConfig("multiInstance")) {
                    // Someone tried to run a second instance, we should focus our window.
                    if (passedWindow) {
                        if (passedWindow.isMinimized()) passedWindow.restore();
                        passedWindow.show();
                        passedWindow.focus();
                    }
                    if (commandLine && commandLine.length > 0) {
                        console.log(commandLine);
                        const lastArg = commandLine.pop();
                        if (lastArg?.startsWith("discord://-")) {
                            navigateTo(passedWindow, lastArg.replace("discord://-", ""));
                        }
                    }
                } else {
                    await init();
                }
            })();
        });
    }
    app.on("activate", async () => {
        app.show();
    });
    passedWindow.webContents.on("frame-created", (_, { frame }) => {
        if (!frame) {
            return;
        }
        frame.once("dom-ready", async () => {
            if (
                frame.url.includes("youtube.com/embed/") ||
                (frame.url.includes("discordsays") && frame.url.includes("youtube.com"))
            ) {
                await frame.executeJavaScript(readFileSync(path.join(__dirname, "assets/js/adguard.js"), "utf-8"));
            }
        });
    });
    passedWindow.webContents.setWindowOpenHandler(({ url }) => {
        // Allow about:blank (used by Vencord & Equicord QuickCss popup)
        if (url === "about:blank") return { action: "allow" };
        // Saving ics files on future events
        if (url.startsWith("blob:https://discord.com/")) {
            return {
                action: "allow",
                overrideBrowserWindowOptions: { show: false },
            };
        }
        // Allow Discord stream popout
        if (
            url === "https://discord.com/popout" ||
            url === "https://canary.discord.com/popout" ||
            url === "https://ptb.discord.com/popout"
        )
            return {
                action: "allow",
                overrideBrowserWindowOptions: {
                    alwaysOnTop: getConfig("popoutPiP"),
                },
            };
        const isHttpOrHttps = isHttpUrl(url);
        const shouldRoute = isHttpOrHttps && getCachedRouteDecision(url);
        if (isHttpOrHttps && isDownloadManagerEnabled() && shouldRoute) {
            void (async () => {
                try {
                    const manager = getActiveDownloadManager();
                    const queued = await queueDownloadToManager(passedWindow, url, manager);
                    if (!queued) {
                        openExternalWithReason(url);
                    }
                } catch {
                    openExternalWithReason(url);
                }
            })();
        } else if (isHttpOrHttps && isDownloadManagerEnabled() && !shouldRoute) {
            openExternalWithReason(url);
        } else if (isHttpOrHttps || url.startsWith("mailto:")) {
            openExternalWithReason(url);
        } else if (ignoreProtocolWarning) {
            openExternalWithReason(url);
        } else {
            const options: MessageBoxOptions = {
                type: "question",
                buttons: [getLang("dialog-openUrl-yes"), getLang("dialog-openUrl-no")],
                defaultId: 1,
                title: getLang("dialog-openUrl-title"),
                message: getLang("dialog-openUrl-message").replace("{url}", url),
                detail: getLang("dialog-openUrl-detail"),
                checkboxLabel: getLang("dialog-openUrl-checkbox"),
                checkboxChecked: false,
            };

            void dialog.showMessageBox(passedWindow, options).then(({ response, checkboxChecked }) => {
                console.log(response, checkboxChecked);
                if (checkboxChecked) {
                    if (response === 0) {
                        setConfig("ignoreProtocolWarning", true);
                    } else {
                        setConfig("ignoreProtocolWarning", false);
                    }
                }
                if (response === 0) {
                    openExternalWithReason(url);
                }
            });
        }

        return { action: "deny" };
    });

    passedWindow.webContents.on("will-navigate", (event, url) => {
        if (!isHttpUrl(url)) {
            return;
        }

        if (!isDownloadManagerEnabled()) {
            return;
        }

        if (!getCachedRouteDecision(url)) {
            return;
        }
        event.preventDefault();
        void (async () => {
            try {
                const manager = getActiveDownloadManager();
                const queued = await queueDownloadToManager(passedWindow, url, manager);
                if (!queued) {
                    openExternalWithReason(url);
                }
            } catch {
                openExternalWithReason(url);
            }
        })();
    });

    passedWindow.webContents.session.setSpellCheckerLanguages(getConfig("spellcheckLanguage"));
    registerDownloadManagerHandler(passedWindow.webContents.session);

    registerCustomHandler();

    const blockedPatterns = [
        /https:\/\/.*\/api\/v\d+\/science/,
        /https:\/\/sentry\.io\/.*/,
        /https:\/\/.*\.nel\.cloudflare\.com\/.*/,
    ];

    passedWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        if (details.url.includes("ws://127.0.0.1:")) {
            return callback({ cancel: true });
        }

        if (blockedPatterns.some((pattern) => pattern.test(details.url))) {
            return callback({ cancel: true });
        }

        return callback({});
    });

    passedWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        if (details.url.startsWith("https://www.youtube.com/embed/")) {
            details.requestHeaders.Referer = "https://google.com";
        }

        callback({ requestHeaders: details.requestHeaders });
    });

    // fix UMG video playback handled in unified onBeforeSendHeaders above
    if (getConfig("tray") === "dynamic") {
        passedWindow.webContents.on("page-favicon-updated", (_, favicons) => {
            try {
                let favicon = nativeImage.createFromDataURL(favicons[0]);

                switch (process.platform) {
                    case "darwin":
                        favicon = favicon.resize({ height: 22 });
                        break;
                    case "win32":
                        favicon = favicon.resize({ height: 32 });
                        break;
                }

                tray.setImage(favicon);
            } catch {
                return;
            }
        });
    }

    passedWindow.setTouchBar(mainTouchBar);
    app.on("open-url", (_event, url) => {
        navigateTo(passedWindow, url.replace("discord://-", ""));
    });

    passedWindow.webContents.on("page-title-updated", (e, title) => {
        const legcordSuffix = " - Legcord";
        const unreadMessages = getLang("title-unreadMessages");

        // Helper to extract ping count from title
        const extractPings = (t: string): number | null => {
            const match = /\((\d+)\)/.exec(t);
            return match ? Number.parseInt(match[1]) : null;
        };

        // Handle overlay icon/badges based on platform
        if (process.platform === "win32") {
            if (title.startsWith("•")) {
                passedWindow.setOverlayIcon(
                    nativeImage.createFromPath(path.join(import.meta.dirname, "../", "/assets/badge-11.ico")),
                    unreadMessages,
                );
            } else if (title.startsWith("(")) {
                const pings = extractPings(title);
                const badgeFile = pings && pings > 9 ? "badge-10.ico" : `badge-${pings}.ico`;
                passedWindow.setOverlayIcon(
                    nativeImage.createFromPath(path.join(import.meta.dirname, "../", `/assets/${badgeFile}`)),
                    unreadMessages,
                );
            } else {
                passedWindow.setOverlayIcon(null, "");
            }
        }

        if (process.platform === "darwin") {
            if (title.startsWith("•")) {
                app.dock?.setBadge("•");
            } else if (title.startsWith("(")) {
                const pings = extractPings(title);
                if (pings && getConfig("bounceOnPing")) app.dock?.bounce();
                app.setBadgeCount(pings ?? 0);
            } else {
                app.setBadgeCount(0);
            }
        }

        // Update window title with Legcord suffix
        if (!title.endsWith(legcordSuffix)) {
            e.preventDefault();
            void passedWindow.webContents.executeJavaScript(
                `document.title = '${title.replace("Discord |", "") + legcordSuffix}'`,
            );
        }
    });
    injectThemesMain(passedWindow);
    passedWindow.on("unresponsive", () => {
        passedWindow.webContents.reload();
    });

    setMenu();
    passedWindow.on("close", (e) => {
        if (mainWindows.length > 1) {
            mainWindows = mainWindows.filter((mainWindow) => mainWindow.id !== passedWindow.id);
            passedWindow.destroy();
        }
        if (getConfig("minimizeToTray") && !forceQuit) {
            e.preventDefault();
            passedWindow.hide();
        } else if (!getConfig("minimizeToTray")) {
            app.quit();
        }
    });
    app.on("before-quit", () => {
        stopRPC();
        const [width, height] = passedWindow.getSize();
        setWindowState({
            width,
            height,
            isMaximized: passedWindow.isMaximized(),
            x: passedWindow.getPosition()[0],
            y: passedWindow.getPosition()[1],
        });
        setForceQuit(true);
    });
    passedWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        // Lune Dev exceptions, https://github.com/uwu/shelter/blob/8d4ca369bf01abf348df9d4e111d534800c7a38c/packages/shelter/src/devmode/index.tsx#L24
        if (
            details.url.includes("ws://127.0.0.1:") &&
            !details.url.includes("127.0.0.1:1211") &&
            !details.url.includes("127.0.0.1:1112") &&
            !details.url.includes("127.0.0.1:6888")
        ) {
            return callback({ cancel: true });
        }
        return callback({});
    });
    passedWindow.on("focus", () => {
        void passedWindow.webContents.executeJavaScript(`document.body.removeAttribute("unFocused");`);
    });
    passedWindow.on("blur", () => {
        void passedWindow.webContents.executeJavaScript(`document.body.setAttribute("unFocused", "");`);
    });

    passedWindow.on("maximize", () => {
        void passedWindow.webContents.executeJavaScript(`document.body.setAttribute("isMaximized", "");`);
    });
    passedWindow.on("unmaximize", () => {
        void passedWindow.webContents.executeJavaScript(`document.body.removeAttribute("isMaximized");`);
    });
    if (getConfig("inviteWebsocket") && mainWindows.length === 1) {
        startRPC(passedWindow);
    }
    if (firstRun) {
        passedWindow.close();
    }

    registerGlobalKeybinds();
    switch (getConfig("channel")) {
        case "stable":
            void passedWindow.loadURL("https://discord.com/app");
            break;
        case "canary":
            void passedWindow.loadURL("https://canary.discord.com/app");
            break;
        case "ptb":
            void passedWindow.loadURL("https://ptb.discord.com/app");
            break;
        default:
            void passedWindow.loadURL("https://discord.com/app");
            break;
    }

    if (getConfig("skipSplash")) {
        passedWindow.show();
    }
}

export function createWindow() {
    const browserWindowOptions: BrowserWindowConstructorOptions = {
        width: getWindowState("width") ?? 835,
        height: getWindowState("height") ?? 600,
        x: getWindowState("x"),
        y: getWindowState("y"),
        title: "Legcord",
        show: false,
        darkTheme: true,
        icon: getConfig("customIcon") ?? path.join(import.meta.dirname, "../", "/assets/desktop.png"),
        frame: false,
        backgroundColor: "#202225",
        autoHideMenuBar: getConfig("autoHideMenuBar"),
        webPreferences: {
            sandbox: true,
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: getConfig("sleepInBackground"),
            preload: path.join(import.meta.dirname, "discord/preload.mjs"),
            spellcheck: getConfig("spellcheck"),
        },
    };
    switch (getConfig("windowStyle")) {
        case "default":
            if (os.platform() === "win32") {
                browserWindowOptions.titleBarStyle = "hidden";
                browserWindowOptions.titleBarOverlay = false;
            }
            break;
        case "native":
            browserWindowOptions.frame = true;
            break;
        case "overlay":
            browserWindowOptions.titleBarStyle = "hidden";
            browserWindowOptions.titleBarOverlay = {
                color: getConfig("overlayButtonColor"),
                symbolColor: "#99aab5",
                height: 30,
            };
            browserWindowOptions.trafficLightPosition = {
                x: 10,
                y: 10,
            };
            break;
    }
    switch (getConfig("transparency")) {
        case "universal":
            browserWindowOptions.backgroundColor = "#00000000";
            browserWindowOptions.transparent = true;
            break;
        case "modern":
            if (os.platform() === "win32") {
                browserWindowOptions.backgroundColor = "#00000000";
                browserWindowOptions.transparent = false;
                browserWindowOptions.frame = true;
                browserWindowOptions.backgroundMaterial = getConfig("windowMaterial");
            } else if (os.platform() === "darwin") {
                browserWindowOptions.backgroundColor = "#00000000";
                browserWindowOptions.vibrancy = "fullscreen-ui";
                browserWindowOptions.transparent = true;
            }
            break;
        case "none":
            break;
    }
    const mainWindow = new BrowserWindow(browserWindowOptions);
    mainWindows.push(mainWindow);
    doAfterDefiningTheWindow(mainWindow);
}
