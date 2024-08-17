export interface Settings {
    // Referenced for detecting a broken config.
    "0"?: string;
    // Only used for external url warning dialog.
    ignoreProtocolWarning?: boolean;
    customIcon: string;
    windowStyle: "default" | "native" | "transparent";
    channel: "stable" | "ptb" | "canary";
    armcordCSP: boolean;
    minimizeToTray: boolean;
    multiInstance: boolean;
    spellcheck: boolean;
    mods: ("vencord" | "shelter")[];
    dynamicIcon: boolean;
    mobileMode: boolean;
    skipSplash: boolean;
    performanceMode: string;
    customJsBundle: RequestInfo | URL;
    customCssBundle: RequestInfo | URL;
    startMinimized: boolean;
    useLegacyCapturer: boolean;
    tray: boolean;
    keybinds: string[];
    inviteWebsocket: boolean;
    disableAutogain: boolean;
    trayIcon: string;
    doneSetup: boolean;
    clientName: string;
    smoothScroll: boolean;
    autoScroll: boolean;
}
