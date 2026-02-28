import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Game } from "arrpc";
import { type BrowserWindow, app, clipboard, dialog, ipcMain, shell } from "electron";
import isDev from "electron-is-dev";
import type { Keybind } from "../@types/keybind.js";
import type { Settings } from "../@types/settings.js";
import type { ThemeManifest } from "../@types/themeManifest.js";
import {
    blacklistGame as blacklistGameAdd,
    unblacklistGame as blacklistGameRemove,
    getBlacklist,
} from "../common/blacklistGame.js";
import { getConfig, getConfigLocation, setConfig, setConfigBulk } from "../common/config.js";
import { addDetectable, getDetectables, removeDetectable } from "../common/detectables.js";
import { getLang, getLangName, getRawLang, setLang } from "../common/lang.js";
import { disableQuickCss, initQuickCss, installTheme, setThemeEnabled, uninstallTheme } from "../common/themes.js";
import { getDisplayVersion, getVersion } from "../common/version.js";
import { openCssEditor } from "../cssEditor/main.js";
import { getAppliedFlags } from "../main.js";
import { isPowerSavingEnabled, setPowerSaving } from "../power.js";
import constPaths from "../shared/consts/paths.js";
import { splashWindow } from "../splash/main.js";
import { refreshGlobalKeybinds } from "./globalKeybinds.js";
import { processList, refreshProcessList } from "./rpcProcess.js";
import { importGuilds, mainTouchBar, setVoiceState, voiceTouchBar } from "./touchbar.js";

const userDataPath = app.getPath("userData");
const storagePath = path.join(userDataPath, "/storage/");
const themesPath = path.join(userDataPath, "/themes/");
const pluginsPath = path.join(userDataPath, "/plugins/");
const pluginStoragePath = path.join(userDataPath, "/plugin-storage/");
const quickCssPath = path.join(userDataPath, "/quickCss.css");

/** Sanitize plugin id to safe dir name (alphanumeric, dash, underscore only). */
function sanitizePluginId(pluginId: string): string {
    return pluginId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "default";
}

/** Resolve relative path for a plugin; returns null if path escapes plugin dir. */
function resolvePluginFilePath(pluginId: string, relativePath: string): string | null {
    const safeId = sanitizePluginId(pluginId);
    const baseDir = path.resolve(pluginStoragePath, safeId);
    const resolved = path.resolve(baseDir, path.normalize(relativePath));
    const relative = path.relative(baseDir, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
    return resolved;
}

function ifExistsRead(path: string): string | undefined {
    if (existsSync(path)) return readFileSync(path, "utf-8");
}

export function registerIpc(passedWindow: BrowserWindow): void {
    ipcMain.handle("getShelterBundle", () => {
        return {
            js: ifExistsRead(path.join(app.getPath("userData"), "shelter.js")),
            enabled: true,
        };
    });
    ipcMain.handle("getVencordBundle", () => {
        return {
            js: ifExistsRead(path.join(app.getPath("userData"), "vencord.js")),
            css: ifExistsRead(path.join(app.getPath("userData"), "vencord.css")),
            enabled: getConfig("mods").includes("vencord"),
        };
    });
    ipcMain.handle("getEquicordBundle", () => {
        return {
            js: ifExistsRead(path.join(app.getPath("userData"), "equicord.js")),
            css: ifExistsRead(path.join(app.getPath("userData"), "equicord.css")),
            enabled: getConfig("mods").includes("equicord"),
        };
    });
    ipcMain.handle("getCustomBundle", () => {
        const enabled = getConfig("mods").includes("custom");
        if (enabled) {
            return {
                js: ifExistsRead(path.join(app.getPath("userData"), "custom.js")),
                css: ifExistsRead(path.join(app.getPath("userData"), "custom.css")),
                enabled,
            };
        }
    });

    // theming
    ipcMain.on("enableQuickCss", () => {
        console.log("Enabling quick CSS");
        initQuickCss(passedWindow);
    });
    ipcMain.on("disableQuickCss", () => {
        console.log("Disabling quick CSS");
        disableQuickCss(passedWindow);
    });
    ipcMain.on("openQuickCss", () => {
        if (getConfig("useSystemCssEditor")) {
            void shell.openPath(quickCssPath);
        } else {
            openCssEditor(quickCssPath);
        }
    });
    ipcMain.on("importQuickCss", (_event, css: string) => {
        let currentCss = readFileSync(quickCssPath, "utf-8");
        currentCss += `\n/* Imported CSS */\n${css}`;
        writeFileSync(quickCssPath, currentCss, "utf-8");
    });
    ipcMain.on("openThemesFolder", () => {
        shell.showItemInFolder(themesPath);
    });
    ipcMain.on("openImportPicker", () => {
        dialog
            .showOpenDialog({
                title: getLang("dialog-importTheme-title"),
                buttonLabel: getLang("dialog-importTheme-button"),
                properties: ["openFile", "multiSelections"],
                filters: [
                    { name: getLang("dialog-importTheme-discordStyles"), extensions: ["scss", "css"] },
                    { name: getLang("dialog-importTheme-allFiles"), extensions: ["*"] },
                ],
            })
            .then((result) => {
                if (result.canceled) return;
                for (const file of result.filePaths) {
                    installTheme(file);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    });
    ipcMain.on("setThemeEnabled", (_event, name: string, enabled: boolean) => {
        console.log(name, enabled);
        setThemeEnabled(name, enabled);
    });
    ipcMain.on("editTheme", (_event, id: string) => {
        const manifest = JSON.parse(readFileSync(`${themesPath}/${id}/manifest.json`, "utf8")) as ThemeManifest;
        if (getConfig("useSystemCssEditor")) {
            void shell.openPath(`${themesPath}/${id}/${manifest.theme}`);
        } else {
            openCssEditor(`${themesPath}/${id}/${manifest.theme}`);
        }
    });
    ipcMain.on("openThemeFolder", (_event, id: string) => {
        void shell.openPath(path.join(themesPath, id));
    });
    ipcMain.on("uninstallTheme", (_event, id: string) => {
        uninstallTheme(id);
    });

    ipcMain.handle("installBDTheme", async (_event, link: string) => {
        await installTheme(link);
    });

    ipcMain.on("getThemes", (event) => {
        const themes = [];
        const themeFolders = readdirSync(themesPath);
        for (const folder of themeFolders) {
            if (existsSync(`${themesPath}/${folder}/manifest.json`)) {
                const manifest = JSON.parse(
                    readFileSync(`${themesPath}/${folder}/manifest.json`, "utf8"),
                ) as ThemeManifest;
                themes.push({ ...manifest, id: folder });
            }
        }
        event.returnValue = themes;
    });

    ipcMain.on("splashEnd", () => {
        splashWindow.close();
        if (getConfig("startMinimized")) {
            passedWindow.hide();
        } else {
            passedWindow.show();
        }
    });
    ipcMain.on("setLang", (_event, lang: string) => {
        setLang(lang);
    });
    ipcMain.on("setVoiceTouchbar", (_event, state: boolean) => {
        if (state) {
            passedWindow.setTouchBar(voiceTouchBar);
        } else {
            passedWindow.setTouchBar(mainTouchBar);
        }
    });
    ipcMain.on("importGuilds", (_event, array: Array<string>) => {
        importGuilds(array);
    });
    ipcMain.on("setVoiceState", (_event, mute: boolean, deafen: boolean) => {
        setVoiceState(mute, deafen);
    });
    ipcMain.on("getLangSync", (event, toGet: string) => {
        event.reply("langString", getLang(toGet));
    });
    ipcMain.handle("getLang", (_event, toGet: string) => {
        return getLang(toGet);
    });

    ipcMain.on("setPowerSaving", (_event, state: boolean) => {
        setPowerSaving(state);
    });
    ipcMain.on("isPowerSavingEnabled", (event) => {
        event.returnValue = isPowerSavingEnabled();
    });

    ipcMain.on("win-maximize", () => {
        passedWindow.maximize();
    });
    ipcMain.on("win-isMaximized", (event) => {
        event.returnValue = passedWindow.isMaximized();
    });
    ipcMain.on("win-isNormal", (event) => {
        event.returnValue = passedWindow.isNormal();
    });
    ipcMain.on("win-minimize", () => {
        passedWindow.minimize();
    });
    ipcMain.on("win-unmaximize", () => {
        passedWindow.unmaximize();
    });
    ipcMain.on("win-show", () => {
        passedWindow.show();
    });
    ipcMain.on("win-hide", () => {
        passedWindow.hide();
    });
    ipcMain.on("win-quit", () => {
        app.quit();
    });
    ipcMain.on("get-app-version", (event) => {
        event.returnValue = getVersion();
    });
    ipcMain.on("displayVersion", (event) => {
        event.returnValue = getDisplayVersion();
    });
    ipcMain.on("restart", () => {
        app.relaunch();
        app.exit();
    });
    ipcMain.on("isDev", (event) => {
        event.returnValue = isDev;
    });
    ipcMain.on("dumpFlags", (event) => {
        const flags = getAppliedFlags();
        console.log(`=== Chrome Flags === ${JSON.stringify(flags)}`);
        event.returnValue = flags;
    });
    ipcMain.on("setConfig", (event, key: keyof Settings, value: Settings[keyof Settings]) => {
        setConfig(key, value);
        event.returnValue = undefined;
    });
    ipcMain.on("getRpcBlacklist", (event) => {
        event.returnValue = getBlacklist();
    });
    ipcMain.on("blacklistGame", (event, name: string, id: number) => {
        blacklistGameAdd(name, id);
        event.returnValue = undefined;
    });
    ipcMain.on("unblacklistGame", (event, id: number) => {
        blacklistGameRemove(id);
        event.returnValue = undefined;
    });
    ipcMain.on("addKeybind", (_event, keybind: Keybind) => {
        const keybinds = getConfig("keybinds");
        keybinds.push(keybind);
        setConfig("keybinds", keybinds);
        refreshGlobalKeybinds();
    });
    ipcMain.on("toggleKeybind", (_event, id: string) => {
        const keybinds = getConfig("keybinds");
        const keybind = keybinds[keybinds.findIndex((x) => x.id === id)];
        keybind.enabled = !keybind.enabled;
        setConfig("keybinds", keybinds);
        refreshGlobalKeybinds();
    });
    ipcMain.on("removeKeybind", (_event, id: string) => {
        const keybinds = getConfig("keybinds");
        keybinds.splice(
            keybinds.findIndex((x) => x.id === id),
            1,
        );
        setConfig("keybinds", keybinds);
        refreshGlobalKeybinds();
    });
    ipcMain.on("getEntireConfig", (event) => {
        const rawData = readFileSync(getConfigLocation(), "utf-8");
        event.returnValue = JSON.parse(rawData) as Settings;
    });
    ipcMain.on("getTranslations", (event) => {
        event.returnValue = getRawLang();
    });
    ipcMain.on("getConfig", (event, arg: keyof Settings) => {
        event.returnValue = getConfig(arg);
    });
    ipcMain.on("saveSettings", (_event, args: Settings) => {
        console.log(args);
        setConfigBulk(args);
    });
    ipcMain.on("openStorageFolder", () => {
        shell.showItemInFolder(storagePath);
    });
    ipcMain.on("openThemesFolder", () => {
        shell.showItemInFolder(themesPath);
    });
    ipcMain.on("openPluginsFolder", () => {
        shell.showItemInFolder(pluginsPath);
    });
    ipcMain.on("openCrashesFolder", () => {
        shell.showItemInFolder(path.join(app.getPath("temp"), `${app.getName()} Crashes`));
    });
    ipcMain.on("getLangName", (event) => {
        event.returnValue = getLangName();
    });
    ipcMain.on("crash", () => {
        process.crash();
    });
    ipcMain.on("getOS", (event) => {
        event.returnValue = process.platform;
    });
    ipcMain.on("getOSRelease", (event) => {
        event.returnValue = os.release();
    });
    ipcMain.on("copyDebugInfo", () => {
        const settingsFileContent = readFileSync(getConfigLocation(), "utf-8");
        clipboard.writeText(
            `**OS:** ${os.platform()} ${os.version()}\n**Architecture:** ${os.arch()}\n**Legcord version:** ${getVersion()}\n**Electron version:** ${
                process.versions.electron
            }\n\`${settingsFileContent}\``,
        );
    });
    ipcMain.on("copyGPUInfo", () => {
        clipboard.writeText(JSON.stringify(app.getGPUFeatureStatus()));
    });
    ipcMain.on("openCustomIconDialog", () => {
        dialog
            .showOpenDialog({
                properties: ["openFile"],
                filters: [{ name: getLang("dialog-customIcon-filters"), extensions: ["ico", "png", "icns"] }],
            })
            .then((result) => {
                if (result.canceled) return;
                console.log(result.filePaths[0]);
                setConfig("customIcon", result.filePaths[0]);
            });
    });
    ipcMain.on("getConstPaths", (event) => {
        event.returnValue = constPaths;
    });
    ipcMain.on("getProcessList", (event) => {
        event.returnValue = processList;
    });

    // custom detectables control
    ipcMain.on("refreshProcessList", () => {
        refreshProcessList();
    });
    ipcMain.on("getDetectables", (event) => {
        event.returnValue = getDetectables();
    });
    ipcMain.on("addDetectable", (_event, game: Game) => {
        addDetectable(game);
    });
    ipcMain.on("removeDetectable", (_event, id: string) => {
        removeDetectable(id);
    });

    // Plugin storage API (gated by extendedPluginAbilities)
    ipcMain.handle(
        "pluginWriteFile",
        async (
            _event,
            pluginId: string,
            relativePath: string,
            data: string,
        ): Promise<{ ok: true } | { ok: false; error: string }> => {
            if (!getConfig("extendedPluginAbilities")) {
                return { ok: false, error: "EXTENSION_DISABLED" };
            }
            if (typeof pluginId !== "string" || typeof relativePath !== "string" || typeof data !== "string") {
                return { ok: false, error: "INVALID_ARGS" };
            }
            const resolved = resolvePluginFilePath(pluginId, relativePath);
            if (!resolved) return { ok: false, error: "INVALID_PATH" };
            try {
                mkdirSync(path.dirname(resolved), { recursive: true });
                writeFileSync(resolved, data, "utf-8");
                return { ok: true };
            } catch (err) {
                return { ok: false, error: err instanceof Error ? err.message : "UNKNOWN" };
            }
        },
    );
    ipcMain.handle(
        "pluginReadFile",
        async (
            _event,
            pluginId: string,
            relativePath: string,
        ): Promise<{ ok: true; data: string } | { ok: false; error: string }> => {
            if (!getConfig("extendedPluginAbilities")) {
                return { ok: false, error: "EXTENSION_DISABLED" };
            }
            if (typeof pluginId !== "string" || typeof relativePath !== "string") {
                return { ok: false, error: "INVALID_ARGS" };
            }
            const resolved = resolvePluginFilePath(pluginId, relativePath);
            if (!resolved) return { ok: false, error: "INVALID_PATH" };
            try {
                if (!existsSync(resolved)) return { ok: false, error: "NOT_FOUND" };
                const data = readFileSync(resolved, "utf-8");
                return { ok: true, data };
            } catch (err) {
                return { ok: false, error: err instanceof Error ? err.message : "UNKNOWN" };
            }
        },
    );
}
