import path from "node:path";
import {
    BrowserWindow,
    type MessageBoxOptions,
    type Streams,
    desktopCapturer,
    dialog,
    ipcMain,
    session,
} from "electron";
import { getConfig } from "../common/config.js";

let capturerWindow: BrowserWindow;
let isDone: boolean;
function showAudioDialog(): boolean {
    const options: MessageBoxOptions = {
        type: "question",
        buttons: ["Yes", "No"],
        defaultId: 1,
        title: "Screenshare audio",
        message: "Would you like to screenshare audio?",
        detail: "Selecting yes will make viewers of your stream hear your entire system audio.",
    };

    void dialog.showMessageBox(capturerWindow, options).then(({ response }) => {
        if (response === 0) {
            return true;
        } else {
            return false;
        }
    });
    return true;
}

function registerCustomHandler(): void {
    session.defaultSession.setDisplayMediaRequestHandler(
        (request, callback) => {
            console.log(request);
            void desktopCapturer
                .getSources({
                    types: ["screen", "window"],
                })
                .then((sources) => {
                    if (!sources) return callback({});
                    isDone = false;
                    console.log(sources);
                    if (process.platform === "linux" && process.env.XDG_SESSION_TYPE?.toLowerCase() === "wayland") {
                        console.log("WebRTC Capturer detected, skipping window creation."); //assume webrtc capturer is used
                        let options: Streams = { video: sources[0] };
                        if (sources[0] === undefined) return callback({});
                        if (showAudioDialog() === true) options = { video: sources[0], audio: getConfig("audio") };
                        callback(options);
                    } else {
                        capturerWindow = new BrowserWindow({
                            width: 800,
                            height: 600,
                            title: "Legcord Screenshare",
                            darkTheme: true,
                            icon:
                                getConfig("customIcon") ?? path.join(import.meta.dirname, "../", "/assets/desktop.png"),
                            frame: true,
                            autoHideMenuBar: true,
                            webPreferences: {
                                sandbox: false,
                                spellcheck: false,
                                preload: path.join(import.meta.dirname, "screenshare", "preload.mjs"),
                            },
                        });
                        ipcMain.once("selectScreenshareSource", (_event, id: string, name: string, audio: boolean) => {
                            isDone = true;
                            console.log(`Audio status: ${audio}`);
                            capturerWindow.close();
                            const result = { id, name };
                            let options: Streams = { video: sources[0] };
                            switch (process.platform) {
                                case "win32":
                                case "linux":
                                    options = { video: result };
                                    if (audio) options = { video: result, audio: getConfig("audio") };
                                    callback(options);
                                    break;
                                default:
                                    callback({ video: result });
                            }
                        });
                        capturerWindow.on("closed", () => {
                            if (!isDone) callback({});
                        });
                        void capturerWindow.loadFile(path.join(import.meta.dirname, "html", "picker.html"));
                        capturerWindow.webContents.send("getSources", sources);
                    }
                });
        },
        { useSystemPicker: true },
    );
}
registerCustomHandler();
