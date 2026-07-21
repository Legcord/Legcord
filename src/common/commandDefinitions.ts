// static command definitions to retrieve at build-time without calling electron-dev indirectly

export enum ValidActions {
    mute = "mute",
    deafen = "deafen",
    leaveCall = "leave",
    openSettings = "opensettings",
    help = "help",
}

export const actionDescriptions: Record<ValidActions, string> = {
    [ValidActions.mute]: "Toggle microphone mute",
    [ValidActions.deafen]: "Toggle deafen (mute audio input/output)",
    [ValidActions.leaveCall]: "Leave the current voice call",
    [ValidActions.openSettings]: "Open the settings panel",
    [ValidActions.help]: "Shows this help message",
};

export const ACTION_FRIENDLY_NAMES: Record<ValidActions, string> = {
    [ValidActions.mute]: "Toggle Mute",
    [ValidActions.deafen]: "Toggle Deafen",
    [ValidActions.leaveCall]: "Leave Call",
    [ValidActions.openSettings]: "Open Settings",
    [ValidActions.help]: "ignore (help)",
};

// we don't need a 'show help' shortcut do we? be fr
export const EXCLUDED_FROM_SHORTCUTS: ValidActions[] = [ValidActions.help];
