import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import type { BrowserWindow } from "electron";
import type { Settings } from "../src/@types/settings.ts";

const userData = mkdtempSync(join(tmpdir(), "legcord-dock-test-"));
mkdirSync(join(userData, "storage"));
writeFileSync(join(userData, "storage", "window.json"), "{}");
const electronStub = `data:text/javascript,${encodeURIComponent(`
    export const app = { getPath: () => ${JSON.stringify(userData)} };
    export const dialog = { showErrorBox() { throw new Error("Unexpected config repair failure"); } };
`)}`;
const dockStub = `data:text/javascript,${encodeURIComponent(`
    export let updates = 0;
    export function applyDockVisibility() { updates++; }
`)}`;
const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier === "electron") return { url: electronStub, shortCircuit: true };
        if (specifier === "../discord/dock.js" && context.parentURL?.endsWith("windowVisibility.ts")) {
            return { url: dockStub, shortCircuit: true };
        }
        return nextResolve(specifier, context);
    },
});

const config = await import("../src/common/config.ts");
const { applyStartupWindowVisibility, navigateTo, revealWindow } = await import("../src/common/windowVisibility.ts");

after(() => {
    hooks.deregister();
    rmSync(userData, { recursive: true, force: true });
});

function windowFixture(minimized = false, destroyed = false) {
    const calls: string[] = [];
    const scripts: string[] = [];
    const win = {
        isDestroyed: () => destroyed,
        isMinimized: () => minimized,
        setSkipTaskbar: (value: boolean) => calls.push(`skip:${value}`),
        restore: () => calls.push("restore"),
        show: () => calls.push("show"),
        hide: () => calls.push("hide"),
        focus: () => calls.push("focus"),
        minimize: () => calls.push("minimize"),
        webContents: {
            executeJavaScript: async (script: string) => {
                scripts.push(script);
            },
        },
    } as unknown as BrowserWindow;
    return { win, calls, scripts };
}

describe("Persisted Dock settings and window restoration", () => {
    it("defaults to a visible Dock and completes old configurations", (t) => {
        t.mock.method(console, "log", () => {});
        config.setup();
        assert.equal(config.getConfig("hideDock"), false);
        assert.equal(config.isIpcWritableSettingsKey("hideDock"), true);
        delete (config.getEntireConfig() as Partial<Settings>).hideDock;
        writeFileSync(config.getConfigLocation(), JSON.stringify(config.getEntireConfig()));
        config.checkIfConfigIsBroken();
        assert.equal(config.getConfig("hideDock"), false);
        assert.equal(JSON.parse(readFileSync(config.getConfigLocation(), "utf8")).hideDock, false);
    });

    it("normalizes individual writes, persists them, and keeps the restored icon when disabled", () => {
        config.setConfig("tray", "disabled");
        config.setConfig("hideDock", true);
        const expectedTray = process.platform === "darwin" ? "dynamic" : "disabled";
        const saved = JSON.parse(readFileSync(config.getConfigLocation(), "utf8"));
        assert.equal(saved.hideDock, true);
        assert.equal(saved.tray, expectedTray);
        config.setConfig("tray", "disabled");
        assert.equal(config.getConfig("tray"), expectedTray);
        config.setConfig("hideDock", false);
        assert.equal(config.getConfig("tray"), expectedTray);
    });

    it("normalizes conflicting grouped writes and reloads the saved preference", async () => {
        config.setConfigBulk({ hideDock: true, tray: "disabled" } as Settings);
        assert.equal(config.getConfig("tray"), process.platform === "darwin" ? "dynamic" : "disabled");
        const reloaded = await import(`${new URL("../src/common/config.ts", import.meta.url).href}?reload`);
        assert.equal(reloaded.getConfig("hideDock"), true);
        assert.equal(reloaded.getConfig("tray"), config.getConfig("tray"));
    });

    it("reveals and restores the window without undoing Dock hiding", () => {
        config.setConfig("hideDock", true);
        const f = windowFixture(true);
        revealWindow(f.win);
        assert.deepEqual(f.calls, [
            ...(process.platform === "darwin" ? [] : ["skip:false"]),
            "restore",
            "show",
            "focus",
        ]);
    });

    it("preserves all startup window modes while the Dock is hidden", () => {
        config.setConfig("hideDock", true);
        for (const mode of ["off", "minimized", "tray"] as const) {
            config.setConfig("startMinimized", mode);
            const f = windowFixture();
            applyStartupWindowVisibility(f.win);
            const expected = mode === "tray" ? ["hide"] : mode === "minimized" ? ["show", "minimize"] : ["show"];
            if (process.platform !== "darwin") expected.unshift(`skip:${mode === "tray"}`);
            assert.deepEqual(f.calls, expected);
        }
    });

    it("retains existing taskbar behavior when the setting is disabled", () => {
        config.setConfig("hideDock", false);
        config.setConfig("startMinimized", "tray");
        const f = windowFixture();
        applyStartupWindowVisibility(f.win);
        revealWindow(f.win);
        assert.deepEqual(f.calls, ["skip:true", "hide", "skip:false", "show", "focus"]);
    });

    it("uses the same restoration path for Discord links and sanitizes the URL", (t) => {
        t.mock.method(console, "log", () => {});
        config.setConfig("hideDock", true);
        const f = windowFixture();
        navigateTo(f.win, '/channels/@me/123";');
        assert.ok(f.scripts[0].includes('history.pushState({}, null, "/channels/@me/123")'));
        assert.deepEqual(f.calls, [...(process.platform === "darwin" ? [] : ["skip:false"]), "show", "focus"]);
        const destroyed = windowFixture(false, true);
        navigateTo(destroyed.win, "/channels/@me");
        revealWindow(destroyed.win);
        applyStartupWindowVisibility(destroyed.win);
        assert.deepEqual(destroyed.calls, []);
        assert.deepEqual(destroyed.scripts, []);
    });
});
