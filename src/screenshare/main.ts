import {BrowserWindow, desktopCapturer, ipcMain, session, shell} from "electron";
import path from "path";
import {iconPath} from "../main";
var capturerWindow: BrowserWindow;
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
    ipcMain.on("selectScreenshareSource", (event, id, name) => {
        console.log(sources[id]);
        console.log(id);
        callback({video: {id, name}});

        capturerWindow.close();
    });
    capturerWindow.webContents.setWindowOpenHandler(({url}) => {
        shell.openExternal(url);
        return {action: "deny"};
    });
    capturerWindow.loadURL(`file://${__dirname}/picker.html`);
    capturerWindow.webContents.send("getSources", sources);
});
