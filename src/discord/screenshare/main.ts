import {BrowserWindow, MessageBoxOptions, desktopCapturer, dialog, ipcMain, session} from "electron";
import path from "path";
import {iconPath} from "../../main.js";
let capturerWindow: BrowserWindow;
function showAudioDialog(): boolean {
    const options: MessageBoxOptions = {
        type: "question",
        buttons: ["Yes", "No"],
        defaultId: 1,
        title: "Screenshare audio",
        message: `Would you like to screenshare audio?`,
        detail: "Selecting yes will make viewers of your stream hear your entire system audio."
    };

    dialog.showMessageBox(capturerWindow, options).then(({response}) => {
        if (response == 0) {
            return true;
        } else {
            return false;
        }
    });
    return true;
}

function registerCustomHandler(): void {
    session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
        console.log(request);
        const sources = await desktopCapturer.getSources({
            types: ["screen", "window"]
        });
        console.log(sources);
        if (process.platform === "linux" && process.env.XDG_SESSION_TYPE?.toLowerCase() === "wayland") {
            console.log("WebRTC Capturer detected, skipping window creation."); //assume webrtc capturer is used
            var options: Electron.Streams = {video: sources[0]};
            if (showAudioDialog() == true) options = {video: sources[0], audio: "loopbackWithMute"};
            callback(options);
        } else {
            capturerWindow = new BrowserWindow({
                width: 800,
                height: 600,
                title: "ArmCord Screenshare",
                darkTheme: true,
                icon: iconPath,
                frame: true,
                autoHideMenuBar: true,
                webPreferences: {
                    sandbox: false,
                    spellcheck: false,
                    preload: path.join(import.meta.dirname, "preload.js")
                }
            });
            ipcMain.once("selectScreenshareSource", (_event, id, name) => {
                //console.log(sources[id]);
                //console.log(id);
                capturerWindow.close();
                let result = {id, name};
                if (process.platform === "linux" || process.platform === "win32") {
                    var options: Electron.Streams = {video: sources[0]};
                    if (showAudioDialog() == true) options = {video: sources[0], audio: "loopbackWithMute"};
                    callback(options);
                } else {
                    callback({video: result});
                }
            });
            capturerWindow.loadURL(`file://${import.meta.dirname}/picker.html`);
            capturerWindow.webContents.send("getSources", sources);
        }
    });
}
registerCustomHandler();
