const customTitlebar = require('custom-electron-titlebar')

window.addEventListener('DOMContentLoaded', () => {
  new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex("#2C2F33"),
  });


})
require("./utils/capturer.js")