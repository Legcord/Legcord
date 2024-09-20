import { app, globalShortcut } from "electron";
import { mainWindows } from "./window.js";
let isAudioEngineEnabled = false;
void app.whenReady().then(() => {
    globalShortcut.register("Cmd+M", () => {
        /**/
    });
    const ret = globalShortcut.register("CommandOrControl+Shift+M", () => {
        console.log("Mute keybind pressed");
        if (!isAudioEngineEnabled) {
            mainWindows.forEach((window) => {
                void window.webContents.executeJavaScript(`
                    window.shelter.flux.dispatcher.dispatch({     "type": "MEDIA_ENGINE_SET_AUDIO_ENABLED",     "enabled": true,     "unmute": true });
                `);
                isAudioEngineEnabled = true;
            });
        }

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
    });

    if (!ret) {
        console.log("registration failed");
    }
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});
