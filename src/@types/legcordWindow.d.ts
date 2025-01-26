import type { Node } from "@vencord/venmic";
import type { Keybind } from "./keybind.js";
import type { Settings } from "./settings.js";
import type { ThemeManifest } from "./themeManifest.js";

export interface LegcordWindow {
    window: {
        show: () => void;
        hide: () => void;
        minimize: () => void;
        maximize: () => void;
    };
    electron: string;
    getLang: (toGet: string) => Promise<string>;
    version: string;
    platform: string;
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
        openQuickCssFile: () => void;
        edit: (id: string) => void;
        folder: (id: string) => void;
    };
}
