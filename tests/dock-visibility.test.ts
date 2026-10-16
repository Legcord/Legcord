import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Settings } from "../src/@types/settings.ts";
import { createDockVisibilityController, normalizeDockSettings } from "../src/common/dockVisibility.ts";

function fixture(platform: NodeJS.Platform = "darwin") {
    let visible = true;
    let trayAvailable = true;
    let ensureTray = () => trayAvailable;
    const events: string[] = [];
    const errors: unknown[] = [];
    const dock = {
        isVisible: () => visible,
        hide: () => {
            events.push("hide");
            visible = false;
        },
        show: async () => {
            events.push("show");
            visible = true;
        },
    };
    const controller = createDockVisibilityController({
        platform,
        getDock: () => dock,
        ensureTray: () => {
            events.push("tray");
            return ensureTray();
        },
        onError: (error) => errors.push(error),
    });
    return {
        controller,
        dock,
        events,
        errors,
        setTrayAvailable: (value: boolean) => {
            trayAvailable = value;
        },
        failTray: () => {
            ensureTray = () => {
                throw new Error("Tray creation failed");
            };
        },
        isVisible: () => visible,
    };
}

async function settle() {
    await Promise.resolve();
    await Promise.resolve();
}

describe("Dock visibility", () => {
    it("creates the menu bar access before hiding, and shows the Dock immediately when disabled", async () => {
        const f = fixture();
        f.controller.setHidden(true);
        assert.deepEqual(f.events, ["tray", "hide"]);
        assert.equal(f.isVisible(), false);
        f.controller.setHidden(false);
        await settle();
        assert.equal(f.isVisible(), true);
        assert.deepEqual(f.events, ["tray", "hide", "show"]);
        f.controller.dispose();
    });

    it("does not touch the Dock or tray on other platforms", () => {
        for (const platform of ["linux", "win32"] as const) {
            const f = fixture(platform);
            f.controller.setHidden(true);
            f.controller.setHidden(false);
            assert.deepEqual(f.events, []);
            f.controller.dispose();
        }
    });

    it("coalesces rapid changes and spaces actual hide calls by 1100 ms", async (t) => {
        t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 10000 });
        const f = fixture();
        f.controller.setHidden(true);
        f.controller.setHidden(false);
        await settle();
        f.controller.setHidden(true);
        t.mock.timers.tick(1099);
        assert.equal(f.isVisible(), true);
        t.mock.timers.tick(1);
        assert.equal(f.isVisible(), false);
        assert.equal(f.events.filter((event) => event === "hide").length, 2);
        f.controller.dispose();
    });

    it("cancels a delayed hide when the final request is to show the Dock", async (t) => {
        t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 10000 });
        const f = fixture();
        f.controller.setHidden(true);
        f.controller.setHidden(false);
        await settle();
        f.controller.setHidden(true);
        f.controller.setHidden(false);
        t.mock.timers.tick(2000);
        assert.equal(f.isVisible(), true);
        assert.equal(f.events.filter((event) => event === "hide").length, 1);
        f.controller.dispose();
    });

    it("honors a hide request arriving while dock.show() is still pending", async (t) => {
        t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 10000 });
        const f = fixture();
        f.controller.setHidden(true);
        const originalShow = f.dock.show;
        let finishShow = () => {};
        f.dock.show = async () => {
            await new Promise<void>((resolve) => {
                finishShow = resolve;
            });
            await originalShow();
        };
        f.controller.setHidden(false);
        f.controller.setHidden(true);
        finishShow();
        await settle();
        t.mock.timers.tick(1100);
        assert.equal(f.isVisible(), false);
        f.controller.dispose();
    });

    it("restores Dock access if the tray is unavailable or creation throws", async () => {
        for (const fail of ["unavailable", "throws"]) {
            const f = fixture();
            f.controller.setHidden(true);
            if (fail === "throws") f.failTray();
            else f.setTrayAvailable(false);
            f.controller.setHidden(true);
            await settle();
            assert.equal(f.isVisible(), true);
            assert.equal(f.errors.length, 1);
            f.controller.dispose();
        }
    });

    it("does not hide later after disposal", async (t) => {
        t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 10000 });
        const f = fixture();
        f.controller.setHidden(true);
        f.controller.setHidden(false);
        await settle();
        f.controller.setHidden(true);
        f.controller.dispose();
        t.mock.timers.tick(2000);
        f.controller.setHidden(true);
        assert.equal(f.isVisible(), true);
    });
});

describe("Dock settings", () => {
    it("restores a disabled menu bar icon only when hiding the Dock on macOS", () => {
        for (const platform of ["darwin", "linux", "win32"] as const) {
            const settings: Partial<Settings> = { hideDock: true, tray: "disabled" };
            assert.equal(normalizeDockSettings(settings, platform), platform === "darwin");
            assert.equal(settings.tray, platform === "darwin" ? "dynamic" : "disabled");
        }
    });

    it("preserves the chosen icon and keeps it enabled when Dock hiding is disabled", () => {
        const settings: Partial<Settings> = { hideDock: true, tray: "ac_white_plug" };
        assert.equal(normalizeDockSettings(settings, "darwin"), false);
        assert.equal(settings.tray, "ac_white_plug");
        settings.tray = "disabled";
        normalizeDockSettings(settings, "darwin");
        settings.hideDock = false;
        normalizeDockSettings(settings, "darwin");
        assert.equal(settings.tray, "dynamic");
    });
});
