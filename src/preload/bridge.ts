import { contextBridge, ipcRenderer } from "electron";
import { getDisplayMediaSelector } from "./capturer";
import { injectTitlebar } from "./titlebar";

contextBridge.exposeInMainWorld("armcord", {
  window: {
    show: () => ipcRenderer.send("win-show"),
    hide: () => ipcRenderer.send("win-hide"),
    minimize: () => ipcRenderer.send("win-minimize"),
    maximize: () => ipcRenderer.send("win-maximize"),
  },
  titlebar: {
    injectTitlebar: () => injectTitlebar(),
    isTitlebar: ipcRenderer.sendSync("titlebar"),
  },
  electron: process.versions.electron,
  channel: ipcRenderer.sendSync("channel"),
  openTab: (number: number) => ipcRenderer.sendSync("openTab", number),
  version: ipcRenderer.sendSync("get-app-version", "app-version"),
  getDisplayMediaSelector: getDisplayMediaSelector,
  openSettingsWindow: () => ipcRenderer.send("openSettingsWindow"),
});
//to be only used inside armcord internal setup/splash etc
if (
  window.location.href.indexOf("splash.html") > -1 ||
  window.location.href.indexOf("setup.html") > -1
) {
  contextBridge.exposeInMainWorld("armcordinternal", {
    restart: () => ipcRenderer.send("restart"),
    saveSettings: (...args: any) => ipcRenderer.send("saveSettings", ...args),
    splashEnd: () => ipcRenderer.send("splashEnd"),
  });
}