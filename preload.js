const customTitlebar = require('custom-electron-titlebar')
const electronLocalshortcut = require("electron-localshortcut");
const { remote } = require("electron");

window.addEventListener('DOMContentLoaded', () => {
  new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex("#2C2F33"),
  });


})
const currentWindow = remote.getCurrentWindow();
electronLocalshortcut.register(currentWindow, "F5", () => {
  location.reload();
});
electronLocalshortcut.register(currentWindow, "F12", () => {
  currentWindow.webContents.openDevTools();
});
require("./utils/capturer.js")
