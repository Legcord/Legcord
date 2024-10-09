export type KeybindActions = "mute" | "deafen" | "navigateBack" | "navigateForward" | "openQuickCss";
export interface Keybind {
    accelerator: Electron.Accelerator;
    action: KeybindActions;
    global: boolean;
    enabled: boolean;
    id: string;
}
