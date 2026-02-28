import type { Node } from "@vencord/venmic";
import type { Game, GameList, ProcessInfo } from "arrpc";
import type { IPCSources } from "../shelter/screenshare/components/SourceCard.tsx";
import type { Keybind } from "./keybind.js";
import type { Settings } from "./settings.js";
import type { ThemeManifest } from "./themeManifest.js";

export interface LegcordWindow {
    window: {
        show: () => void;
        hide: () => void;
        minimize: () => void;
        maximize: () => void;
        unmaximize: () => void;
        quit: () => void;
        maximized: () => boolean;
        isNormal: () => boolean;
    };
    electron: string;
    getLang: (toGet: string) => Promise<string>;
    version: string;
    platform: string;
    osRelease: string;
    restart: () => void;
    translations: string;
    settings: {
        getConfig: () => Readonly<Settings>;
        setConfig: <K extends keyof Settings>(object: K, toSet: Settings[K]) => void;
        openStorageFolder: () => void;
        openThemesFolder: () => void;
        openCustomIconDialog: () => void;
        copyDebugInfo: () => void;
        copyGPUInfo: () => void;
        setLang(lang: string): () => void;
        addKeybind: (keybind: Keybind) => void;
        toggleKeybind: (id: string) => void;
        removeKeybind: (id: string) => void;
    };
    touchbar: {
        setVoiceTouchbar: (state: boolean) => void;
        setVoiceState: (mute: boolean, deafen: boolean) => void;
        importGuilds: (array: Array<string>) => void;
    };
    power: {
        setPowerSaving: (state: boolean) => void;
        isPowerSavingEnabled: () => boolean;
    };
    screenshare: {
        getSources: (
            callback: (event: Electron.IpcRendererEvent, sources: Array<IPCSources>, ...args: unknown[]) => void,
        ) => void;
        start: (id: string, name: string, audio: boolean) => void;
        venmicStart: (include: Node[]) => Promise<boolean>;
        venmicSystemStart: (exclude: Node[]) => Promise<boolean>;
        venmicList: () => Promise<
            { ok: true; targets: Node[]; hasPipewirePulse: boolean } | { ok: false; isGlibCxxOutdated: boolean }
        >;
        venmicStop: () => Promise<void>;
    };
    themes: {
        install: (url: string) => void;
        openImportPicker: () => void;
        uninstall: (id: string) => void;
        set: (id: string, state: boolean) => void;
        getThemes: () => Readonly<ThemeManifest[]>;
        openQuickCss: () => void;
        edit: (id: string) => void;
        folder: (id: string) => void;
        importQuickCss: (css: string) => void;
        disableQuickCss: () => void;
        enableQuickCss: () => void;
    };
    rpc: {
        listen: (msg: {
            activity: {
                assets: { large_image: string | null; small_image: string | null };
                application_id: number;
                name: string;
            };
        }) => void;
        getProcessList: () => ProcessInfo[];
        refreshProcessList: () => void;
        addDetectable: (e: Game) => void;
        removeDetectable: (id: string) => void;
        getDetectables: () => GameList;
        getBlacklist: () => DetectedGame[];
        blacklistGame: (name: string, id: number) => void;
        unblacklistGame: (id: number) => void;
    };
    /** Plugin storage API. Requires user to enable "Extended plugin abilities" in Legcord settings. */
    fs: {
        writeFile: (
            pluginId: string,
            relativePath: string,
            data: string,
        ) => Promise<{ ok: true } | { ok: false; error: string }>;
        readFile: (
            pluginId: string,
            relativePath: string,
        ) => Promise<{ ok: true; data: string } | { ok: false; error: string }>;
    };
}

export interface DetectedGame {
    name: string;
    id: number;
}

export interface LegcordRPC {
    lastDetectedGames: DetectedGame[];
    onLastDetectedUpdate: ((list: DetectedGame[]) => void) | null;
    listen: (msg: {
        activity: {
            assets: { large_image: string | null; small_image: string | null };
            application_id: number;
            name: string;
        };
    }) => void;
}

declare global {
    interface Window {
        legcordRPC?: LegcordRPC;
    }
}
