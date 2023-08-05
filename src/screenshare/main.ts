import {BrowserWindow, desktopCapturer, ipcMain, session} from "electron";
import path from "path";
import {iconPath} from "../main";

let capturerWindow: BrowserWindow;
function registerCustomHandler(): void {
    session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
        console.log(request);
        // if (process.platform == "linux") {
        //     let isAudio = isAudioSupported();
        //     if (isAudio) {
        //         console.log("audio supported");
        //         getSinks();
        //     }
        // }
        const sources = await desktopCapturer.getSources({
            types: ["screen", "window"]
        });
        console.log(sources);
        if (process.platform === "linux" && process.env.XDG_SESSION_TYPE?.toLowerCase() === "wayland") {
            console.log("WebRTC Capturer detected, skipping window creation."); //assume webrtc capturer is used
            console.log({video: {id: sources[0].id, name: sources[0].name}});
            callback({video: {id: sources[0].id, name: sources[0].name}});
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
                    preload: path.join(__dirname, "preload.js")
                }
            });
            ipcMain.once("selectScreenshareSource", (_event, id, name) => {
                //console.log(sources[id]);
                //console.log(id);
                capturerWindow.close();
                let result = {id, name, width: 9999, height: 9999};
                if (process.platform === "win32") {
                    callback({video: result, audio: "loopback"});
                } else {
                    callback({video: result});
                }
            });
            capturerWindow.loadURL(`file://${__dirname}/picker.html`);
            capturerWindow.webContents.send("getSources", sources);
        }
    });
}
registerCustomHandler();
