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

export interface AudioSettings {
    workaround: boolean;
    deviceSelect: boolean;
    granularSelect: boolean;
    ignoreVirtual: boolean;
    ignoreDevices: boolean;
    ignoreInputMedia: boolean;
    onlySpeakers: boolean;
    onlyDefaultSpeakers: boolean;
    loopbackType: "loopback" | "loopbackWithMute";
}

export interface Settings {
    // Referenced for detecting a broken config.
    "0"?: string;
    // Only used for external url warning dialog.
    ignoreProtocolWarning?: boolean;
    customIcon: string;
    windowStyle: "default" | "native" | "overlay" | "transparent" | "legacy" | "rebrand";
    channel: "stable" | "ptb" | "canary";
    transparency: "universal" | "modern" | "none";
    windowMaterial: "mica" | "tabbed" | "acrylic" | "none";
    audio: AudioSettings;
    legcordCSP: boolean;
    minimizeToTray: boolean;
    multiInstance: boolean;
    spellcheck: boolean;
    mods: ValidMods[];
    mobileMode: boolean;
    skipSplash: boolean;
    performanceMode: "battery" | "dynamic" | "performance" | "smoothScreenshare" | "none";
    customJsBundle: RequestInfo | URL | string;
    customCssBundle: RequestInfo | URL | string;
    startMinimized: boolean;
    keybinds: Keybind[];
    hardwareAcceleration: boolean;
    useMacSystemPicker: boolean;
    inviteWebsocket: boolean;
    disableAutogain: boolean;
    autoHideMenuBar: boolean;
    vaapi: boolean;
    blockPowerSavingInVoiceChat: boolean;
    disableHttpCache: boolean;
    tray: ValidTrayIcons;
    doneSetup: boolean;
    spellcheckLanguage: string[];
    smoothScroll: boolean;
    bounceOnPing: boolean;
    popoutPiP: boolean;
    sleepInBackground: boolean;
    useSystemCssEditor: boolean;
    quickCss: boolean;
    autoScroll: boolean;
    additionalArguments: string;
    noBundleUpdates: ValidMods[];
    automaticUpdates: boolean;
    overlayButtonColor: string;
    processScanning: boolean;
    windowsLegacyScanning: boolean;
    scanInterval: number;
    modCache?: Record<ValidMods, string>;
    extendedPluginAbilities: boolean;
    supportBannerDismissed: boolean;
}
