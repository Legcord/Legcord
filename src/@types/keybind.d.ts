export type KeybindActions = "mute" | "deafen" | "navigateBack" | "navigateForward";
export interface Keybind {
    accelerator: Electron.Accelerator;
    action: KeybindActions;
    global: boolean;
    enabled: boolean;
    id: string;
}
