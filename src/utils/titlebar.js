const { remote } = require("electron");
const { readFileSync } = require("fs");
const ArmCord = require("./armcord.js");
const css = readFileSync("../styles/utils/titlebar.style");
var win = remote.BrowserWindow.getFocusedWindow();

document.addEventListener("DOMContentLoaded", function (event) {
  var elem = document.createElement("div");
  elem.innerHTML = `<nav class="titlebar">
    <div class="window-title" id="window-title"></div>
    <div id="window-controls-container">
        <div id="minimize"></div>
        <div id="maximize"></div>
        <div id="quit"></div>
    </div>
  </nav>`;
  document.body.appendChild(elem);
  
  ArmCord.addStyle(css);

  var minimize = document.querySelector("#minimize");
  var maximize = document.querySelector("#maximize");
  var quit = document.querySelector("#quit");

  minimize.addEventListener("click", () => {
    win.minimize();
  });

  maximize.addEventListener("click", () => {
    if (win.isMaximized() == true) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  quit.addEventListener("click", () => {
    win.close();
  });
});
