import { ipcRenderer } from "electron";
import { addStyle } from "../utils";
import * as fs from "fs";
import * as path from "path";
export function injectTitlebar() {
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
    elem.classList.add("withFrame-haYltI");
    if (document.getElementById("app-mount") == null) {
      document.body.appendChild(elem);
    } else {
      document.getElementById("app-mount")!.prepend(elem);
    }
    const cssPath = path.join(__dirname, "../", "/content/css/titlebar.css");
    addStyle(fs.readFileSync(cssPath, "utf8"));

    var minimize = document.getElementById("minimize");
    var maximize = document.getElementById("maximize");
    var quit = document.getElementById("quit");

    minimize!.addEventListener("click", () => {
      ipcRenderer.send("win-minimize");
    });

    maximize!.addEventListener("click", () => {
      if (ipcRenderer.sendSync("win-isMaximized") == true) {
        ipcRenderer.send("win-unmaximize");
      } else {
        ipcRenderer.send("win-maximize");
      }
    });

    quit!.addEventListener("click", () => {
      ipcRenderer.send("win-hide");
    });
  });
}
export function removeTitlebar() {
  document.querySelector("#titlebar")!.remove();
}
