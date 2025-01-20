import type { Keybind } from "./keybind.js";

export type ValidMods = "vencord" | "equicord" | "custom" | "shelter";

export type ValidTrayIcons =
    | "dynamic"
    | "dsc-tray"
    | "clsc-dsc-tray"
    | "ac_plug_colored"
    | "ac_white_plug"
    | "ac_white_plug_hollow"
    | "ac_black_plug"
    | "ac_black_plug_hollow"
    | "disabled";

export interface Settings {
    // Referenced for detecting a broken config.
    "0"?: string;
    // Only used for external url warning dialog.
    ignoreProtocolWarning?: boolean;
    customIcon: string;
    windowStyle: "default" | "native" | "overlay" | "transparent";
    channel: "stable" | "ptb" | "canary";
    audio: "loopback" | "loopbackWithMute";
    transparency: "universal" | "modern" | "none";
    legcordCSP: boolean;
    minimizeToTray: boolean;
    multiInstance: boolean;
    spellcheck: boolean;
    mods: ValidMods[];
    mobileMode: boolean;
    skipSplash: boolean;
    performanceMode: "battery" | "dynamic" | "performance" | "vaapi" | "none";
    customJsBundle: RequestInfo | URL | string;
    customCssBundle: RequestInfo | URL | string;
    startMinimized: boolean;
    keybinds: Keybind[];
    hardwareAcceleration: boolean;
    useMacSystemPicker: boolean;
    inviteWebsocket: boolean;
    disableAutogain: boolean;
    disableTitlebarChecks: boolean;
    blockPowerSavingInVoiceChat: boolean;
    disableHttpCache: boolean;
    tray: ValidTrayIcons;
    doneSetup: boolean;
    spellcheckLanguage: string[];
    smoothScroll: boolean;
    popoutPiP: boolean;
    autoScroll: boolean;
    additionalArguments: string;
    modCache?: Record<ValidMods, string>;
    bitrateMin: number;
    bitrateMax: number;
    bitrateTarget: number;
}
