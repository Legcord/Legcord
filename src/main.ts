// Modules to control application life and create native browser window
import { app, BrowserWindow, ipcMain, shell, desktopCapturer } from "electron";
import * as path from "path";
import "v8-compile-cache";
import * as storage from "electron-json-storage";
import { saveSettings } from "./utils";
import "./extensions/mods";
import "./extensions/plugin";
import "./tray";
var isSetup = null;
var contentPath: string = "null";
var frame: boolean;
export var mainWindow: BrowserWindow;

storage.keys(function (error, keys) {
  if (error) throw error;

  for (var key of keys) {
    console.log("There is a key called: " + key);
  }
});
storage.has("settings", function (error, hasKey) {
  if (error) throw error;

  if (!hasKey) {
    console.log("First run of the ArmCord. Starting setup.");
    isSetup = true;
    // setup(); will be done at setup
    contentPath = __dirname + "/content/setup.html";
  } else {
    console.log("ArmCord has been run before. Skipping setup.");
    isSetup = false;
    contentPath = __dirname + "/content/splash.html";
  }
});
storage.get("settings", function (error, data: any) {
  if (error) throw error;
  console.log(data);
  frame = data.customTitlebar;
  console.log(frame);
});
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 350,
    title: "ArmCord",
    frame: frame,
    webPreferences: {
      preload: path.join(__dirname, "preload/preload.js"),
    },
  });
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
    event.returnValue = process.env.npm_package_version;
  });
  ipcMain.on("splashEnd", (event, arg) => {
    mainWindow.setSize(800, 600);
  });
  ipcMain.on("channel", (event) => {
    storage.get("settings", function (error, data: any) {
      if (error) throw error;
      event.returnValue = data.channel;
    });
  });
  ipcMain.on("saveSettings", (event, ...args) => {
    //@ts-ignore
    saveSettings(...args);
  });
  ipcMain.on('clientmod' , (event, arg) => {
    storage.get("settings", function (error, data: any) {
      if (error) throw error;
      event.returnValue = data.mods;
    });
  })
  ipcMain.on("setting-armcordCSP", (event) => {
    storage.get("settings", function (error, data: any) {
      if (error) throw error;
      if (data.armcordCSP) {
        event.returnValue = true;
      } else {
        event.returnValue = false;
      }
    });
  });
  ipcMain.handle("DESKTOP_CAPTURER_GET_SOURCES", (event, opts) =>
    desktopCapturer.getSources(opts)
  );
  mainWindow.webContents.userAgent =
    "Mozilla/5.0 (X11; Linux x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36"; //fake useragent
  mainWindow.webContents.on("new-window", function (e, url) {
    e.preventDefault();
    shell.openExternal(url);
  });
  mainWindow.loadFile(contentPath);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
