const { contextBridge, remote } = require("electron");
const currentWindow = remote.getCurrentWindow();
const {getDisplayMediaSelector} = require('./capturer')
const ArmCord = require("./ArmCord.js");
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
  ArmCord: ArmCord,
  getDisplayMediaSelector: getDisplayMediaSelector,

});
