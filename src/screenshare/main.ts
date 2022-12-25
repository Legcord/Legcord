import {BrowserWindow, desktopCapturer, ipcMain, session, shell} from "electron";
import path from "path";
import {iconPath} from "../main";
var capturerWindow: BrowserWindow;
function registerCustomHandler() {
    session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
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
        ipcMain.once("selectScreenshareSource", (event, id, name) => {
            console.log(sources[id]);
            console.log(id);
            capturerWindow.close();
            var result = {id, name};
            callback({video: result});
        });
        capturerWindow.loadURL(`file://${__dirname}/picker.html`);
        capturerWindow.webContents.send("getSources", sources);
    });
}
registerCustomHandler();
