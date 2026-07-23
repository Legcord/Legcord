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

/** Chromium/Electron proxy modes — mirrors browser proxy settings. */
export type ProxyMode = "system" | "direct" | "fixed_servers" | "pac_script" | "auto_detect";

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
    csp: "vanilla" | "strict" | "none";
    minimizeToTray: boolean;
    multiInstance: boolean;
    spellcheck: boolean;
    mods: ValidMods[];
    mobileMode: boolean;
    skipSplash: boolean;
    performanceMode:
        | "battery"
        | "dynamic"
        | "performance"
        | "balanced"
        | "memory"
        | "voip"
        | "latency"
        | "smoothScreenshare"
        | "none";
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
    /** How Legcord resolves HTTP(S) proxies (Chromium + main-process fetch). */
    proxyMode: ProxyMode;
    /** Fixed proxy rules, e.g. `http://127.0.0.1:8080` or `socks5://host:1080`. */
    proxyRules: string;
    /** Hosts that bypass the proxy (comma-separated), e.g. `<local>,*.intranet.example`. */
    proxyBypassRules: string;
    /** PAC script URL when proxyMode is `pac_script`. */
    proxyPacScript: string;
    noBundleUpdates: ValidMods[];
    automaticUpdates: boolean;
    overlayButtonColor: string;
    processScanning: boolean;
    windowsLegacyScanning: boolean;
    scanInterval: number;
    modCache?: Record<ValidMods, string>;
    extendedPluginAbilities: boolean;
    supportBannerDismissed: boolean;
    pluginStates?: Record<string, boolean>;
    // Remove below once the plugin system is fully implemented.
    showExperimentalPluginMenu: boolean;
}
