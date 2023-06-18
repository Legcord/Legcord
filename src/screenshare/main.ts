import {BrowserWindow, desktopCapturer, ipcMain, session} from "electron";
import path from "path";
import {iconPath} from "../main";
let capturerWindow: BrowserWindow;
function registerCustomHandler(): void {
    session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
        console.log(request);
        const sources = await desktopCapturer.getSources({
            types: ["screen", "window"]
        });
        console.log(sources);
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
    });
}
registerCustomHandler();
