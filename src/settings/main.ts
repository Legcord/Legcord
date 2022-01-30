import { BrowserWindow, shell } from "electron";
import path from "path";

var settingsWindow;
export function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 500,
    height: 600,
    title: "ArmCord Settings",
    darkTheme: true,
    icon: path.join(__dirname, "/assets/icon_transparent.png"),
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload/preload.js"),
    },
  });

  settingsWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  settingsWindow.loadFile("settings.html");
}
