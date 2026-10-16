import { app } from "electron";
import { getConfig } from "../common/config.js";
import { createDockVisibilityController } from "../common/dockVisibility.js";
import { createTray } from "./tray.js";

const dockVisibility = createDockVisibilityController({
    platform: process.platform,
    getDock: () => app.dock,
    ensureTray: () => createTray(),
    onError: (error) => console.error("[Dock] Could not update Dock visibility; keeping the Dock accessible", error),
});

export function applyDockVisibility(): void {
    if (app.isReady()) dockVisibility.setHidden(getConfig("hideDock") === true);
}

// Auxiliary windows and restored windows must also respect the application-wide setting.
app.on("browser-window-created", (_event, win) => {
    const refresh = () => {
        if (getConfig("hideDock") === true) applyDockVisibility();
    };
    win.on("show", refresh);
    win.on("restore", refresh);
});
app.once("before-quit", () => dockVisibility.dispose());
