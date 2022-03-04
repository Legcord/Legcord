import {app} from "electron";
import {mainWindow} from "./window";
//https://github.com/electron/electron/issues/1334#issuecomment-716080005
// TO-DO add more
app.on("web-contents-created", (webContentsCreatedEvent, webContents) => {
    webContents.on("before-input-event", (beforeInputEvent, input) => {
        // console.log('Main console::', input)
        const {code, alt, control, shift, meta} = input;
        // Shortcut: toggle devTools
        if (shift && control && !alt && !meta && code === "KeyI") {
            mainWindow.webContents.toggleDevTools();
        }
        // Shortcut: window reload
        if (shift && control && !alt && !meta && code === "KeyR") {
            mainWindow.reload();
        }
    });
});
