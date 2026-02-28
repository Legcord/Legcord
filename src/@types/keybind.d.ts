export type KeybindActions =
    | "mute"
    | "deafen"
    | "leaveCall"
    | "navigateBack"
    | "navigateForward"
    | "openQuickCss"
    | "pushToTalk"
    | "runJavascript";
export interface Keybind {
    accelerator: Electron.Accelerator;
    action: KeybindActions;
    global: boolean;
    enabled: boolean;
    id: string;
    js?: string;
}
