const { contextBridge, remote, desktopCapturer } = require("electron");
const currentWindow = remote.getCurrentWindow();
const version = require("../package.json").version;
contextBridge.exposeInMainWorld("electron", {
  window: {
    show: () => currentWindow.show(),
    hide: () => currentWindow.hide(),
    minimize: () => currentWindow.minimize(),
    maximize: () => currentWindow.maximize(),
    on : () => currentWindow.on(),
  },
  electron: process.versions.electron,
  version: version,
  desktopCapturer: desktopCapturer,

});
