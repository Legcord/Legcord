// Modules to control application life and create native browser window
import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  desktopCapturer,
  session,
} from "electron";
import * as path from "path";
import "v8-compile-cache";
import * as storage from "electron-json-storage";
import { saveSettings, getVersion, setup, getConfigUnsafe } from "./utils";
import "./extensions/mods";
import "./extensions/plugin";
import "./tray";
import "./shortcuts";
var contentPath: string;
var channel: string;
export var mainWindow: BrowserWindow;
var settings: any;

storage.has("settings", function (error, hasKey) {
  if (error) throw error;

  if (!hasKey) {
    console.log("First run of the ArmCord. Starting setup.");
    setup();
    contentPath = path.join(__dirname, "/content/setup.html");
    if(!contentPath.includes("ts-out")) {
      contentPath = path.join(__dirname,"/ts-out/content/setup.html");
  }
  } else {
    console.log("ArmCord has been run before. Skipping setup.");
    contentPath = path.join(__dirname,"/content/splash.html");
    if(!contentPath.includes("ts-out")) {
      contentPath = path.join(__dirname,"/ts-out/content/splash.html");
  }
}});
storage.get("settings", function (error, data: any) {
  if (error) throw error;
  console.log(data);
  channel = data.channel;
  settings = data;

});
var titlebar:any = getConfigUnsafe("customTitlebar")
console.log(!titlebar)
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 350,
    title: "ArmCord",
    darkTheme: true,
    icon: path.join(__dirname, "/assets/icon_transparent.png"),
    frame: !titlebar,
    autoHideMenuBar: true,
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
    event.returnValue = channel;
  });
  ipcMain.on("clientmod", (event, arg) => {
    event.returnValue = settings.mods;
  });

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
    "Mozilla/5.0 (X11; Linux x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36"; //fake useragent for screenshare to work
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  console.log(contentPath)
  try {
    mainWindow.loadFile(contentPath);
  } catch(e) {
    console.log("Major error detected while starting up. User is most likely on Windows platform. Fallback to alternative startup.")
    mainWindow.loadURL(`file://${__dirname}/ts-out/content/splash.html`);
  }
}

app.whenReady().then(() => {
  createWindow();
  session
    .fromPartition("some-partition")
    .setPermissionRequestHandler((webContents, permission, callback) => {
      const url = webContents.getURL(); //unused?

      if (permission === "notifications") {
        // Approves the permissions request
        callback(true);
      }
      if (permission === "media") {
        // Approves the permissions request
        callback(true);
      }
      if (url.startsWith("discord://")) {
        // Denies the permissions request
        return callback(false);
      }
      if (url.startsWith("discord.com/science")) {
        // Denies the permissions request
        return callback(false);
      }
      if (url.startsWith("discord.com/tracing")) {
        // Denies the permissions request
        return callback(false);
      }
    });
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
