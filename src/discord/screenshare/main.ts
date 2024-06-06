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

    void dialog.showMessageBox(capturerWindow, options).then(({response}) => {
        if (response == 0) {
            return true;
        } else {
            return false;
        }
    });
    return true;
}

function registerCustomHandler(): void {
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        console.log(request);
        void desktopCapturer
            .getSources({
                types: ["screen", "window"]
            })
            .then((sources) => {
                console.log(sources);
                if (process.platform === "linux" && process.env.XDG_SESSION_TYPE?.toLowerCase() === "wayland") {
                    console.log("WebRTC Capturer detected, skipping window creation."); //assume webrtc capturer is used
                    let options: Electron.Streams = {video: sources[0]};
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
                    ipcMain.once("selectScreenshareSource", (_event, id: string, name: string) => {
                        //console.log(sources[id]);
                        //console.log(id);
                        capturerWindow.close();
                        const result = {id, name};
                        if (process.platform === "linux" || process.platform === "win32") {
                            let options: Electron.Streams = {video: sources[0]};
                            if (showAudioDialog() == true) options = {video: sources[0], audio: "loopbackWithMute"};
                            callback(options);
                        } else {
                            callback({video: result});
                        }
                    });
                    void capturerWindow.loadURL(`file://${import.meta.dirname}/picker.html`);
                    capturerWindow.webContents.send("getSources", sources);
                }
            });
    });
}
registerCustomHandler();
