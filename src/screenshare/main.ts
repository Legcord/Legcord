import {BrowserWindow, MessageBoxOptions, desktopCapturer, ipcMain, session, dialog} from "electron";
import path from "path";
import {iconPath} from "../main";
import {getSinks, isAudioSupported} from "./audio";
let capturerWindow: BrowserWindow;
var sources: Electron.DesktopCapturerSource[];
function openPickerWindow() {
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
    function waitForElement() {
        if (sources == undefined) {
            setTimeout(waitForElement, 250);
            console.log(sources);
        } else {
            capturerWindow.loadURL(`file://${__dirname}/picker.html`);
            capturerWindow.webContents.send("getSources", sources);
        }
    }

    waitForElement();
}
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
        if (process.platform == "linux") {
            const options: MessageBoxOptions = {
                type: "question",
                buttons: ["My screen", "An app"],
                defaultId: 1,
                title: "ArmCord Screenshare",
                message: `What would you like to screenshare?`
            };

            dialog.showMessageBox(options).then(async ({response}) => {
                if (response == 0) {
                    sources = await desktopCapturer.getSources({
                        types: ["screen"]
                    });
                } else {
                    sources = await desktopCapturer.getSources({
                        types: ["window"]
                    });
                }
            });
        } else {
            sources = await desktopCapturer.getSources({
                types: ["screen", "window"]
            });
        }

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
        openPickerWindow();
    });
}
registerCustomHandler();
