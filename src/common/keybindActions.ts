import type { KeybindActions } from "../@types/keybind.js";
import { mainWindows } from "../discord/window.js";
let isAudioEngineEnabled = false;

export function runAction(action: KeybindActions) {
    switch (action) {
        case "mute":
            muteToggle();
            break;
        case "deafen":
            deafenToggle();
            break;
        case "navigateBack":
            navigateBack();
            break;
        case "navigateForward":
            navigateForward();
            break;
    }
}

function audioEngineCheck() {
    if (!isAudioEngineEnabled) {
        mainWindows.forEach((window) => {
            void window.webContents.executeJavaScript(`
                window.shelter.flux.dispatcher.dispatch({"type": "MEDIA_ENGINE_SET_AUDIO_ENABLED","enabled": true,"unmute": true });
            `);
            isAudioEngineEnabled = true;
        });
    }
}
function muteToggle() {
    console.log("[Keybind action] Mute");
    audioEngineCheck();
    mainWindows.forEach((window) => {
        void window.webContents.executeJavaScript(`
                window.shelter.flux.dispatcher.dispatch({
                    "type": "AUDIO_TOGGLE_SELF_MUTE",
                    "context": "default",
                    "syncRemote": true,
                    "skipMuteUnmuteSoundEffect": false
                })
                `);
    });
}

function deafenToggle() {
    console.log("[Keybind action] Deafen");
    audioEngineCheck();
    mainWindows.forEach((window) => {
        void window.webContents.executeJavaScript(`
        window.shelter.flux.dispatcher.dispatch({
            "type": "AUDIO_TOGGLE_SELF_DEAF",
            "context": "default",
            "syncRemote": true
        })
        `);
    });
}

function navigateBack() {
    mainWindows.forEach((window) => {
        window.webContents.navigationHistory.goBack();
    });
}

function navigateForward() {
    mainWindows.forEach((window) => {
        window.webContents.navigationHistory.goForward();
    });
}
