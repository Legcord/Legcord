// To allow seamless switching between custom titlebar and native os titlebar,
// I had to add most of the window creation code here to split both into seperete functions
// WHY? Because I can't use the same code for both due to annoying bug with value `frame` not responding to variables
// I'm sorry for this mess but I'm not sure how to fix it.
import { BrowserWindow, shell } from "electron";
import path from "path";
import { contentPath } from "./main";
import { firstRun } from "./utils";
import { registerIpc } from "./ipc";
export let mainWindow: BrowserWindow;

function doAfterDefiningTheWindow() {
  registerIpc();
  mainWindow.webContents.userAgent =
    "Mozilla/5.0 (X11; Linux x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36"; //fake useragent for screenshare to work
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  console.log(contentPath);
  try {
    mainWindow.loadFile(contentPath);
  } catch (e) {
    console.log(
      "Major error detected while starting up. User is most likely on Windows platform. Fallback to alternative startup."
    );
    console.log(process.platform);
    if (process.platform === "win32") {
      if (firstRun) {
        mainWindow.loadURL(`file://${__dirname}/content/setup.html`);
      } else {
        mainWindow.loadURL(`file://${__dirname}/content/splash.html`);
      }
    } else {
      if (firstRun) {
        mainWindow.loadURL(`file://${__dirname}/ts-out/content/setup.html`);
      } else {
        mainWindow.loadURL(`file://${__dirname}/ts-out/content/splash.html`);
      }
    }
  }
}
export function createCustomWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 350,
    title: "ArmCord",
    darkTheme: true,
    icon: path.join(__dirname, "/assets/icon_transparent.png"),
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload/preload.js"),
    },
  });
  doAfterDefiningTheWindow();
}
export function createNativeWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 350,
    title: "ArmCord",
    darkTheme: true,
    icon: path.join(__dirname, "/assets/icon_transparent.png"),
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload/preload.js"),
    },
  });
  doAfterDefiningTheWindow();
}
