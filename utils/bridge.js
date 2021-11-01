const { contextBridge, remote, desktopCapturer } = require("electron");
const currentWindow = remote.getCurrentWindow();
contextBridge.exposeInMainWorld("electron", {
  window: {
    show: () => currentWindow.show(),
    hide: () => currentWindow.hide(),
    minimize: () => currentWindow.minimize(),
    maximize: () => currentWindow.maximize(),
  },
  version: process.versions.electron,
  desktopCapturer: desktopCapturer,

});
