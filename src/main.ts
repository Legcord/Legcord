// Modules to control application life and create native browser window
import {
  app,
  BrowserWindow,
  session,
} from "electron";
import * as path from "path";
import "v8-compile-cache";
import * as storage from "electron-json-storage";
import { getConfigUnsafe, setup } from "./utils";
import "./extensions/mods";
import "./extensions/plugin";
import "./tray";
import { mainWindow, createCustomWindow, createNativeWindow } from "./window";
import "./shortcuts";
export var contentPath: string;
var channel: string;
export var settings: any;
export var customTitlebar: boolean;
storage.has("settings", function (error, hasKey) {
  if (error) throw error;

  if (!hasKey) {
    console.log("First run of the ArmCord. Starting setup.");
    setup();
    contentPath = path.join(__dirname, "/content/setup.html");
    if (!contentPath.includes("ts-out")) {
      contentPath = path.join(__dirname, "/ts-out/content/setup.html");
    }
  } else {
    console.log("ArmCord has been run before. Skipping setup.");
    contentPath = path.join(__dirname, "/content/splash.html");
    if (!contentPath.includes("ts-out")) {
      contentPath = path.join(__dirname, "/ts-out/content/splash.html");
    }
  }
});
storage.get("settings", function (error, data: any) {
  if (error) throw error;
  console.log(data);
  channel = data.channel;
  settings = data;
});
app.whenReady().then(async () => {
  if (await getConfigUnsafe("customTitlebar") == true) {
    console.log("Creating custom titlebar window.");
    customTitlebar = true;
    createCustomWindow();
  } else if (await getConfigUnsafe("customTitlebar") == "setup") {
    //rare case of setup window
    console.log("Creating setup window.");
    customTitlebar = true;
    createCustomWindow();
  } else {
    console.log("Creating native titlebar window.");
    customTitlebar = false;
    createNativeWindow();
  }
  session
    .fromPartition("some-partition")
    .setPermissionRequestHandler((webContents, permission, callback) => {
      if (permission === "notifications") {
        // Approves the permissions request
        callback(true);
      }
      if (permission === "media") {
        // Approves the permissions request
        callback(true);
      }
    });
  mainWindow.webContents.session.webRequest.onBeforeRequest(
    (details, callback) => {
      if (/api\/v\d\/science$/g.test(details.url))
        return callback({ cancel: true });
      return callback({});
    }
  );
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0)
      if (!settings.customTitlebar) {
        createNativeWindow();
      } else {
        createCustomWindow();
      }
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
