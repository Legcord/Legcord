import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
    app,
    BrowserWindow,
    type BrowserWindowConstructorOptions,
    clipboard,
    dialog,
    type MessageBoxOptions,
    nativeImage,
    net,
    screen,
    shell,
} from "electron";
import contextMenu from "electron-context-menu";
import { firstRun, getConfig, isBackgroundStart, setConfig } from "../common/config.js";
import { navigateTo } from "../common/dom.js";
import { forceQuit, setForceQuit } from "../common/forceQuit.js";
import { handleCommands, passedValidArgument } from "../common/handleCommands.js";
import { getLang } from "../common/lang.js";
import {
    isBlockedLocalhostWebSocket,
    isDiscordIcsBlobUrl,
    isDiscordPopoutUrl,
    isTelemetryBlockedUrl,
    isYouTubeEmbedOrProxyFrame,
} from "../common/sanitization.js";
import { injectThemesMain } from "../common/themes.js";
import {
    DEFAULT_WINDOW_HEIGHT,
    DEFAULT_WINDOW_WIDTH,
    MIN_WINDOW_HEIGHT,
    MIN_WINDOW_WIDTH,
    sanitizeWindowBounds,
} from "../common/windowBounds.js";
import { getWindowState, setWindowState } from "../common/windowState.js";
import { applyStartupWindowVisibility, revealWindow } from "../common/windowVisibility.js";
import { disconnectDbusService } from "../dbus.js";
import { init } from "../main.js";
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

function getStoredWindowBounds() {
    return sanitizeWindowBounds(
        {
            width: getWindowState("width"),
            height: getWindowState("height"),
            x: getWindowState("x"),
            y: getWindowState("y"),
            displayId: getWindowState("displayId"),
        },
        screen.getAllDisplays(),
    );
}

// Save window bounds using the same API family we restore with.
// This avoids coordinate-space mismatches caused by getNormalBounds()/setBounds() across DPI setups.
function saveWindowState(win: BrowserWindow): void {
    try {
        const [x, y] = win.getPosition();
        const [width, height] = win.getSize();
        const sanitized = sanitizeWindowBounds(
            {
                width,
                height,
                x,
                y,
                displayId: screen.getDisplayNearestPoint({ x, y }).id,
            },
            screen.getAllDisplays(),
        );

        setWindowState({
            width: sanitized.width,
            height: sanitized.height,
            isMaximized: win.isMaximized(),
            x: sanitized.x,
            y: sanitized.y,
            displayId: sanitized.displayId,
            displayScaleFactor: sanitized.displayScaleFactor,
        });
    } catch (e) {
        console.log("[Window] Failed to save window state:", e);
    }
}

async function copyImageFromContext(
    parameters: { srcURL: string; x: number; y: number },
    win?: BrowserWindow,
): Promise<void> {
    if (parameters.srcURL) {
        try {
            const response = await net.fetch(parameters.srcURL);
            if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

            const image = nativeImage.createFromBuffer(Buffer.from(await response.arrayBuffer()));
            if (!image.isEmpty()) {
                clipboard.writeImage(image);
                return;
            }
        } catch (error) {
            console.warn("[ContextMenu] Failed to copy image from URL, falling back to copyImageAt:", error);
        }
    }

    win?.webContents.copyImageAt(parameters.x, parameters.y);
}

contextMenu({
    showSaveImageAs: true,
    showCopyImage: false,
    showCopyImageAddress: true,
    showSearchWithGoogle: false,
    append: (_defaultActions, parameters, win) => [
        {
            label: "Copy Image",
            visible: parameters.mediaType === "image",
            click: () => {
                void copyImageFromContext(parameters, win as BrowserWindow | undefined);
            },
        },
    ],
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
    createTray();
    if (getWindowState("isMaximized") ?? false) {
        passedWindow.setSize(DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT); //just so the whole thing doesn't cover whole screen
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
                console.log(`data received: ${additionalData}`);

                if (!getConfig("multiInstance")) {
                    // Someone tried to run a second instance,
                    // we should focus our window if the user is not running special commands.
                    if (passedWindow && !passedValidArgument(commandLine)) {
                        if (passedWindow.isMinimized()) passedWindow.restore();
                        revealWindow(passedWindow);
                    }
                    if (commandLine && commandLine.length > 0) {
                        handleCommands(commandLine);
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
            if (isYouTubeEmbedOrProxyFrame(frame.url)) {
                await frame.executeJavaScript(readFileSync(path.join(__dirname, "assets/js/adguard.js"), "utf-8"));
            }
        });
    });
    passedWindow.webContents.setWindowOpenHandler(({ url }) => {
        // Allow about:blank (used by Vencord & Equicord QuickCss popup)
        if (url === "about:blank") return { action: "allow" };
        // Saving ics files on future events
        if (isDiscordIcsBlobUrl(url)) {
            return {
                action: "allow",
                overrideBrowserWindowOptions: { show: false },
            };
        }
        // Allow Discord stream popout
        if (isDiscordPopoutUrl(url))
            return {
                action: "allow",
                overrideBrowserWindowOptions: {
                    alwaysOnTop: getConfig("popoutPiP"),
                },
            };
        if (url.startsWith("https:") || url.startsWith("http:") || url.startsWith("mailto:")) {
            void shell.openExternal(url);
        } else if (ignoreProtocolWarning) {
            void shell.openExternal(url);
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
                    void shell.openExternal(url);
                }
            });
        }

        return { action: "deny" };
    });

    passedWindow.webContents.session.setSpellCheckerLanguages(getConfig("spellcheckLanguage"));

    registerCustomHandler();

    passedWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        if (isTelemetryBlockedUrl(details.url) || isBlockedLocalhostWebSocket(details.url)) {
            return callback({ cancel: true });
        }
        return callback({});
    });

    // fix UMG video playback
    passedWindow.webContents.session.webRequest.onBeforeSendHeaders(
        { urls: ["https://www.youtube.com/embed/*"] },
        ({ requestHeaders }, callback) => {
            requestHeaders.Referer = "https://google.com";
            callback({ requestHeaders });
        },
    );
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
            return match ? Number.parseInt(match[1], 10) : null;
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
            passedWindow.setTitle(title.replace("Discord |", "") + legcordSuffix);
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
            // Save state when hiding to tray so we persist display metadata
            try {
                saveWindowState(passedWindow);
            } catch {}
            e.preventDefault();
            passedWindow.hide();
        } else if (!getConfig("minimizeToTray")) {
            app.quit();
        }
    });
    app.on("before-quit", () => {
        stopRPC();
        disconnectDbusService();
        try {
            // Ensure current window state is saved with display info
            if (passedWindow && !passedWindow.isDestroyed()) saveWindowState(passedWindow);
        } catch (e) {
            console.log("[Window] before-quit save failed:", e);
        }
        setForceQuit(true);
    });

    // also save on minimize in case of session shutdowns
    passedWindow.on("minimize", () => {
        try {
            saveWindowState(passedWindow);
        } catch {}
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
    // Persist bounds on move/resize with debounce to avoid frequent writes
    let _saveTimer: NodeJS.Timeout | null = null;
    const queueSave = () => {
        if (_saveTimer) clearTimeout(_saveTimer);
        _saveTimer = setTimeout(() => {
            try {
                saveWindowState(passedWindow);
            } catch (e) {
                console.log("[Window] queueSave failed:", e);
            }
            _saveTimer = null;
        }, 500);
    };
    passedWindow.on("move", queueSave);
    passedWindow.on("resize", queueSave);

    // Fallback: periodic poll to detect bounds changes.
    // Compare raw getNormalBounds() values to detect movement;
    // saveWindowState normalizes to DIP where needed.
    let lastPolledBounds: { x: number; y: number; width: number; height: number } | null = null;
    const pollInterval = setInterval(() => {
        try {
            if (passedWindow.isDestroyed()) {
                clearInterval(pollInterval);
                return;
            }
            const { x, y, width, height } = passedWindow.getNormalBounds();
            if (
                !lastPolledBounds ||
                lastPolledBounds.x !== x ||
                lastPolledBounds.y !== y ||
                lastPolledBounds.width !== width ||
                lastPolledBounds.height !== height
            ) {
                lastPolledBounds = { x, y, width, height };
                saveWindowState(passedWindow);
            }
        } catch (_e) {
            // ignore transient errors
        }
    }, 1000);
    passedWindow.on("closed", () => clearInterval(pollInterval));
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

    // When splash won't run, finalize visibility here (splashEnd never fires).
    if (getConfig("skipSplash") || isBackgroundStart()) {
        applyStartupWindowVisibility(passedWindow);
    }
}

export function createWindow() {
    const storedBounds = getStoredWindowBounds();
    if (storedBounds.usedFallback) {
        console.log("[Window] Stored bounds were invalid or off-screen; using sanitized placement", storedBounds);
    }
    const browserWindowOptions: BrowserWindowConstructorOptions = {
        // Use safe defaults for constructor; actual bounds applied via setPosition/setSize below
        width: DEFAULT_WINDOW_WIDTH,
        height: DEFAULT_WINDOW_HEIGHT,
        minWidth: MIN_WINDOW_WIDTH,
        minHeight: MIN_WINDOW_HEIGHT,
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
            // On macOS, frame:true + transparent/vibrancy makes the native title bar
            // and traffic lights invisible (Legcord#1095). Use overlay chrome instead.
            if (os.platform() === "darwin" && getConfig("transparency") !== "none") {
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
            } else {
                browserWindowOptions.frame = true;
            }
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
                y: 8.5,
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

    // Restore by position + size directly to match saveWindowState roundtrip.
    mainWindow.setPosition(storedBounds.x, storedBounds.y);
    mainWindow.setSize(storedBounds.width, storedBounds.height);

    mainWindows.push(mainWindow);
    doAfterDefiningTheWindow(mainWindow);
}
