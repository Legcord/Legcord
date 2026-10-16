import type { BrowserWindow } from "electron";
import { applyDockVisibility } from "../discord/dock.js";
import { getConfig, getStartMinimizedMode } from "./config.js";

function setSkipTaskbar(win: BrowserWindow, skip: boolean): void {
    // On macOS this also changes application-wide Dock visibility.
    if (process.platform !== "darwin" || getConfig("hideDock") !== true) win.setSkipTaskbar(skip);
}

/** Show the main window and restore taskbar/dock presence after a tray-only start. */
export function revealWindow(win: BrowserWindow): void {
    if (win.isDestroyed()) return;
    setSkipTaskbar(win, false);
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    if (getConfig("hideDock") === true) applyDockVisibility();
}

/** Apply startMinimized mode when splash will not call splashEnd, or from splashEnd itself. */
export function applyStartupWindowVisibility(win: BrowserWindow): void {
    if (win.isDestroyed()) return;
    const mode = getStartMinimizedMode();
    switch (mode) {
        case "minimized":
            setSkipTaskbar(win, false);
            win.show();
            win.minimize();
            break;
        case "tray":
            if (getConfig("tray") === "disabled") {
                console.warn(
                    '[Window] startMinimized is "tray" but the tray icon is disabled; the window will be hidden with no tray.',
                );
            }
            setSkipTaskbar(win, true);
            win.hide();
            break;
        default:
            setSkipTaskbar(win, false);
            win.show();
            break;
    }
    if (getConfig("hideDock") === true) applyDockVisibility();
}

export function navigateTo(passedWindow: BrowserWindow, url: string): void {
    if (passedWindow.isDestroyed()) return;
    // Sanitize: only allow path-like URLs (no protocol, no quotes).
    const sanitized = url.replace(/[^a-zA-Z0-9/_\-@.]/g, "");
    console.log(`[legcord deeplink] Navigating to ${sanitized}`);
    void passedWindow.webContents.executeJavaScript(
        `history.pushState({}, null, ${JSON.stringify(sanitized)});window.dispatchEvent(new PopStateEvent("popstate", {}));`,
    );
    revealWindow(passedWindow);
}
