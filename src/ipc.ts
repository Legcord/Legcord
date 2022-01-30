//ipc stuff
import { app, ipcMain, shell, desktopCapturer } from "electron";
import { mainWindow } from "./window";
import { saveSettings, getVersion } from "./utils";
import { settings, customTitlebar } from "./main";
import { createSettingsWindow } from "./settings/main";
export function registerIpc() {
  ipcMain.on("get-app-path", (event, arg) => {
    event.reply("app-path", app.getAppPath());
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

  ipcMain.on("saveSettings", (event, ...args) => {
    //@ts-ignore
    saveSettings(...args);
  });
  ipcMain.on("channel", (event) => {
    event.returnValue = settings.channel;
  });
  ipcMain.on("clientmod", (event, arg) => {
    event.returnValue = settings.mods;
  });
  ipcMain.on("titlebar", (event, arg) => {
    event.returnValue = customTitlebar;
  });
  ipcMain.on("openSettingsWindow", (event, arg) => {
    createSettingsWindow();
  });
  ipcMain.on("setting-armcordCSP", (event) => {
    if (settings.armcordCSP) {
      event.returnValue = true;
    } else {
      event.returnValue = false;
    }
  });
  ipcMain.handle("DESKTOP_CAPTURER_GET_SOURCES", (event, opts) =>
    desktopCapturer.getSources(opts)
  );
  
}
