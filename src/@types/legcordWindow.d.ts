import type { Node } from "@vencord/venmic";
import type { Game, GameList, ProcessInfo } from "arrpc";
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
        getSources: undefined;
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
    };
    rpc: {
        listen: (
            callback: (msg: {
                activity: {
                    assets: { large_image: string | null; small_image: string | null };
                    application_id: number;
                    name: string;
                };
            }) => void,
        ) => void;
        getProcessList: () => ProcessInfo[];
        refreshProcessList: () => void;
        addDetectable: (e: Game) => void;
        getDetectables: () => GameList;
    };
}
