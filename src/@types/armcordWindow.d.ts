import type { Settings } from "./settings.js";

export interface ArmCordWindow {
    window: {
        show: () => void;
        hide: () => void;
        minimize: () => void;
        maximize: () => void;
    };
    electron: string;
    setTrayIcon: (favicon: string) => void;
    getLang: (toGet: string) => Promise<string>;
    getDisplayMediaSelector: () => Promise<string>;
    version: string;
    openThemesWindow: () => void;
    openQuickCssFile: () => void;
    restart: () => void;
    // FIX-ME wrong types
    translations: string;
    settings: {
        config: Settings;
        setConfig: <K extends keyof Settings>(object: K, toSet: Settings[K]) => void;
        openStorageFolder: () => void;
        copyDebugInfo: () => void;
        copyGPUInfo: () => void;
    };
}

declare global {
    interface Window {
        armcord: ArmCordWindow;
    }
}
