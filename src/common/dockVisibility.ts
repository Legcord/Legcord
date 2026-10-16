import type { Dock } from "electron";
import type { Settings } from "../@types/settings.js";

/** Keep a way to reopen Legcord when its Dock icon is hidden. */
export function normalizeDockSettings(settings: Partial<Settings>, platform: NodeJS.Platform): boolean {
    if (platform === "darwin" && settings.hideDock === true && settings.tray === "disabled") {
        settings.tray = "dynamic";
        return true;
    }
    return false;
}

interface DockVisibilityOptions {
    platform: NodeJS.Platform;
    getDock: () => Pick<Dock, "hide" | "show" | "isVisible"> | undefined;
    ensureTray: () => boolean;
    onError: (error: unknown) => void;
}

/** Serialize Dock changes and coalesce rapid toggles to the most recent request. */
export function createDockVisibilityController(options: DockVisibilityOptions) {
    let hidden = false;
    let revision = 0;
    let updating = false;
    let disposed = false;
    let lastHideAt = Number.NEGATIVE_INFINITY;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function clearTimer() {
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
    }

    async function update(): Promise<void> {
        if (disposed || updating || options.platform !== "darwin") return;
        updating = true;
        const currentRevision = revision;
        const dock = options.getDock();
        try {
            if (!dock) return;
            if (hidden) {
                if (!options.ensureTray()) throw new Error("Cannot hide the Dock without a menu bar icon");
                if (!dock.isVisible()) return;

                // Electron ignores dock.hide() calls less than one second apart.
                const delay = 1100 - (Date.now() - lastHideAt);
                if (delay > 0) {
                    timer = setTimeout(() => {
                        timer = undefined;
                        void update();
                    }, delay);
                    return;
                }
                lastHideAt = Date.now();
                dock.hide();
            } else if (!dock.isVisible()) {
                await dock.show();
            }
        } catch (error) {
            options.onError(error);
            try {
                await dock?.show();
            } catch (showError) {
                options.onError(showError);
            }
        } finally {
            updating = false;
            if (revision !== currentRevision) void update();
        }
    }

    return {
        setHidden(value: boolean) {
            hidden = value;
            revision++;
            clearTimer();
            void update();
        },
        dispose() {
            disposed = true;
            clearTimer();
        },
    };
}
