//ipc stuff
import {app, ipcMain, shell, desktopCapturer} from "electron";
import {createTabsGuest, mainWindow} from "./window";
import {setConfigBulk, getVersion, getConfig} from "./utils";
import {customTitlebar, tabs} from "./main";
import {createSettingsWindow} from "./settings/main";
export function registerIpc() {
    ipcMain.on("get-app-path", (event, arg) => {
        event.reply("app-path", app.getAppPath());
    });
    ipcMain.on("openTab", (event, number: number) => {
        createTabsGuest(number);
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
    ipcMain.on("splashEnd", (event, arg) => {
        mainWindow.setSize(800, 600);
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
    ipcMain.on("titlebar", (event, arg) => {
        event.returnValue = customTitlebar;
    });
    ipcMain.on("tabs", (event, arg) => {
        event.returnValue = tabs;
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
