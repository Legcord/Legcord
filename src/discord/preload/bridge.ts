const { contextBridge, ipcRenderer } = require("electron");
import type { Game } from "arrpc";
import type { Keybind } from "../../@types/keybind.js";
import type { LegcordWindow } from "../../@types/legcordWindow.d.ts";
import type { Settings } from "../../@types/settings.js";
import type { ThemeManifest } from "../../@types/themeManifest.js";
import type { venmicListObject } from "../venmic.js";
let windowCallback: (arg0: object) => void;

interface IPCSources {
    id: string;
    name: string;
    thumbnail: HTMLCanvasElement;
}

contextBridge.exposeInMainWorld("legcord", {
    window: {
        show: () => ipcRenderer.send("win-show"),
        hide: () => ipcRenderer.send("win-hide"),
        minimize: () => ipcRenderer.send("win-minimize"),
        maximize: () => ipcRenderer.send("win-maximize"),
        unmaximize: () => ipcRenderer.send("win-unmaximize"),
        maximized: () => ipcRenderer.sendSync("win-isMaximized"),
        isNormal: () => ipcRenderer.sendSync("win-isNormal"),
        quit: () => ipcRenderer.send("win-quit"),
    },
    settings: {
        getConfig: () => ipcRenderer.sendSync("getEntireConfig") as Settings,
        setConfig: (key: string, value: string) => ipcRenderer.send("setConfig", key, value),
        addKeybind: (keybind: Keybind) => ipcRenderer.send("addKeybind", keybind),
        toggleKeybind: (id: string) => ipcRenderer.send("toggleKeybind", id),
        removeKeybind: (id: string) => ipcRenderer.send("removeKeybind", id),
        openStorageFolder: () => ipcRenderer.send("openStorageFolder"),
        setLang: (lang: string) => ipcRenderer.send("setLang", lang),
        openThemesFolder: () => ipcRenderer.send("openThemesFolder"),
        openCustomIconDialog: () => ipcRenderer.send("openCustomIconDialog"),
        copyDebugInfo: () => ipcRenderer.send("copyDebugInfo"),
        copyGPUInfo: () => ipcRenderer.send("copyGPUInfo"),
    },
    touchbar: {
        setVoiceTouchbar: (state: boolean) => ipcRenderer.send("setVoiceTouchbar", state),
        setVoiceState: (mute: boolean, deafen: boolean) => ipcRenderer.send("setVoiceState", mute, deafen),
        importGuilds: (guilds: Array<string>) => ipcRenderer.send("importGuilds", guilds),
    },
    power: {
        setPowerSaving: (state: boolean) => ipcRenderer.send("setPowerSaving", state),
        isPowerSavingEnabled: () => ipcRenderer.sendSync("isPowerSavingEnabled"),
    },
    electron: process.versions.electron,
    translations: ipcRenderer.sendSync("getTranslations") as string,
    getLang: async (toGet: string) =>
        await ipcRenderer.invoke("getLang", toGet).then((result) => {
            return result as string;
        }),
    screenshare: {
        getSources: (
            callback: (event: Electron.IpcRendererEvent, sources: IPCSources[], ...args: unknown[]) => void,
        ) => {
            ipcRenderer.on("getSources", callback);
        },
        start: (source: string, name: string, audio: boolean) =>
            ipcRenderer.send("startScreenshare", source, name, audio),
        venmicStart: async (include: Node[]) =>
            await ipcRenderer.invoke("venmicStart", include).then((result) => {
                return result as venmicListObject;
            }),
        venmicSystemStart: async (exclude: Node[]) =>
            await ipcRenderer.invoke("venmicSystemStart", exclude).then((result) => {
                return result as boolean;
            }),
        venmicList: async () =>
            await ipcRenderer.invoke("venmicList").then((result) => {
                return result as undefined;
            }),
        venmicStop: async () =>
            await ipcRenderer.invoke("venmicStop").then((result) => {
                return result as undefined;
            }),
    },
    version: ipcRenderer.sendSync("get-app-version", "app-version") as string,
    platform: ipcRenderer.sendSync("getOS") as string,
    osRelease: ipcRenderer.sendSync("getOSRelease") as string,
    restart: () => ipcRenderer.send("restart"),
    themes: {
        install: async (url: string) => ipcRenderer.invoke("installBDTheme", url) as Promise<null>,
        uninstall: (id: string) => ipcRenderer.send("uninstallTheme", id),
        edit: (id: string) => ipcRenderer.send("editTheme", id),
        getThemes: () => ipcRenderer.sendSync("getThemes") as ThemeManifest[],
        openImportPicker: () => ipcRenderer.send("openImportPicker"),
        set: (id: string, state: boolean) => ipcRenderer.send("setThemeEnabled", id, state),
        folder: (id: string) => ipcRenderer.send("openThemeFolder", id),
        openQuickCss: () => ipcRenderer.send("openQuickCss"),
    },
    rpc: {
        listen: (callback: () => void) => {
            windowCallback = callback;
        },
        refreshProcessList: () => ipcRenderer.send("refreshProcessList"),
        getProcessList: () => ipcRenderer.sendSync("getProcessList"),
        addDetectable: (detectable: Game) => ipcRenderer.send("addDetectable", detectable),
        getDetectables: () => ipcRenderer.sendSync("getDetectables") as Game[],
    },
} as unknown as LegcordWindow);

ipcRenderer.on("rpc", (_event, data: object) => {
    console.log(data);
    windowCallback(data);
});
