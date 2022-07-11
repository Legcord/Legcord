//ipc stuff
import {app, ipcMain, shell, desktopCapturer} from "electron";
import {mainWindow} from "./window";
import {setConfigBulk, getVersion, getConfig, setLang, getLang, getWindowState} from "./utils";
import {customTitlebar} from "./main";
import {createSettingsWindow} from "./settings/main";
export function registerIpc() {
    ipcMain.on("get-app-path", (event, arg) => {
        event.reply("app-path", app.getAppPath());
    });
    ipcMain.on("setLang", (event, lang: string) => {
        setLang(lang);
    });
    ipcMain.handle("getLang", (event, toGet: string) => {
        return getLang(toGet);
    });
    ipcMain.on("open-external-link", (event, href: string) => {
        shell.openExternal(href);
    });
    ipcMain.on("win-maximize", (event, arg) => {
        mainWindow.maximize();
    });
    ipcMain.on("win-isMaximized", (event, arg) => {
        event.returnValue = mainWindow.isMaximized();
    });
    ipcMain.on("win-isNormal", (event, arg) => {
        event.returnValue = mainWindow.isNormal();
    });
    ipcMain.on("win-minimize", (event, arg) => {
        mainWindow.minimize();
    });
    ipcMain.on("win-unmaximize", (event, arg) => {
        mainWindow.unmaximize();
    });
    ipcMain.on("win-show", (event, arg) => {
        mainWindow.show();
    });
    ipcMain.on("win-hide", (event, arg) => {
        mainWindow.hide();
    });
    ipcMain.on("win-quit", (event, arg) => {
        app.exit();
    });
    ipcMain.on("get-app-version", (event) => {
        event.returnValue = getVersion();
    });
    ipcMain.on("splashEnd", async (event, arg) => {
        try {
        var width = await getWindowState("width") ?? 800;
        var height= await getWindowState("height") ?? 600;
        var isMaximized = await getWindowState("isMaximized") ?? false;
        } catch (e) {
            console.log("No window state file found. Fallbacking to default values.")
            mainWindow.setSize(800, 600);
        }
        if (isMaximized) {
            mainWindow.setSize(800, 600); //just so the whole thing doesn't cover whole screen 
            mainWindow.maximize()
        } else {
            mainWindow.setSize(width, height);
            console.log("Not maximized.")
        }
    });
    ipcMain.on("restart", (event, arg) => {
        app.relaunch();
        app.exit();
    });
    ipcMain.on("saveSettings", (event, args) => {
        setConfigBulk(args);
    });
    ipcMain.on("minimizeToTray", async (event) => {
        event.returnValue = await getConfig("minimizeToTray");
    });
    ipcMain.on("channel", async (event) => {
        event.returnValue = await getConfig("channel");
    });
    ipcMain.on("clientmod", async (event, arg) => {
        event.returnValue = await getConfig("mods");
    });
    ipcMain.on("trayIcon", async (event, arg) => {
        event.returnValue = await getConfig("trayIcon");
    });
    ipcMain.on("titlebar", (event, arg) => {
        event.returnValue = customTitlebar;
    });
    ipcMain.on("mobileMode", async (event, arg) => {
        event.returnValue = await getConfig("mobileMode");
    });
    ipcMain.on("shouldPatch", async (event, arg) => {
        event.returnValue = await getConfig("automaticPatches");
    });
    ipcMain.on("openSettingsWindow", (event, arg) => {
        createSettingsWindow();
    });
    ipcMain.on("setting-armcordCSP", async (event) => {
        if (await getConfig("armcordCSP")) {
            event.returnValue = true;
        } else {
            event.returnValue = false;
        }
    });
    ipcMain.handle("DESKTOP_CAPTURER_GET_SOURCES", (event, opts) => desktopCapturer.getSources(opts));
}
