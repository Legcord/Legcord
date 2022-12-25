import {ipcRenderer} from "electron";
import {addStyle} from "../utils";
import * as fs from "fs";
import * as path from "path";
import os from "os";
export function injectTitlebar() {
    document.addEventListener("DOMContentLoaded", function (event) {
        var elem = document.createElement("div");
        elem.innerHTML = `<nav class="titlebar">
          <div class="window-title" id="window-title"></div>
          <div id="window-controls-container">
              <div id="spacer"></div>
              <div id="minimize"><div id="minimize-icon"></div></div>
              <div id="maximize"><div id="maximize-icon"></div></div>
              <div id="quit"><div id="quit-icon"></div></div>
          </div>
        </nav>`;
        elem.classList.add("withFrame-haYltI");
        if (document.getElementById("app-mount") == null) {
            document.body.appendChild(elem);
        } else {
            document.getElementById("app-mount")!.prepend(elem);
        }
        const titlebarcssPath = path.join(__dirname, "../", "/content/css/titlebar.css");
        const wordmarkcssPath = path.join(__dirname, "../", "/content/css/logos.css");
        addStyle(fs.readFileSync(titlebarcssPath, "utf8"));
        addStyle(fs.readFileSync(wordmarkcssPath, "utf8"));
        document.body.setAttribute("customTitlebar", "");
        document.body.setAttribute("armcord-platform", os.platform());

        var minimize = document.getElementById("minimize");
        var maximize = document.getElementById("maximize");
        var quit = document.getElementById("quit");

        minimize!.addEventListener("click", () => {
            ipcRenderer.send("win-minimize");
        });

        maximize!.addEventListener("click", () => {
            if (ipcRenderer.sendSync("win-isMaximized") == true) {
                ipcRenderer.send("win-unmaximize");
                document.body.removeAttribute("isMaximized");
            } else if (ipcRenderer.sendSync("win-isNormal") == true) {
                ipcRenderer.send("win-maximize");
            }
        });

        quit!.addEventListener("click", () => {
            if (ipcRenderer.sendSync("minimizeToTray") === true) {
                ipcRenderer.send("win-hide");
            } else if (ipcRenderer.sendSync("minimizeToTray") === false) {
                ipcRenderer.send("win-quit");
            }
        });
    });
}

export function fixTitlebar() {
    var elem = document.createElement("div");
    elem.innerHTML = `<nav class="titlebar">
                    <div class="window-title" id="window-title"></div>
                    <div id="window-controls-container">
                        <div id="spacer"></div>
                        <div id="minimize"><div id="minimize-icon"></div></div>
                        <div id="maximize"><div id="maximize-icon"></div></div>
                        <div id="quit"><div id="quit-icon"></div></div>
                    </div>
                    </nav>`;
    elem.classList.add("withFrame-haYltI");
    if (document.getElementById("app-mount") == null) {
        document.body.appendChild(elem);
    } else {
        document.getElementById("app-mount")!.prepend(elem);
    }
    var minimize = document.getElementById("minimize");
    var maximize = document.getElementById("maximize");
    var quit = document.getElementById("quit");

    minimize!.addEventListener("click", () => {
        ipcRenderer.send("win-minimize");
    });

    maximize!.addEventListener("click", () => {
        if (ipcRenderer.sendSync("win-isMaximized") == true) {
            ipcRenderer.send("win-unmaximize");
            document.body.removeAttribute("isMaximized");
        } else if (ipcRenderer.sendSync("win-isNormal") == true) {
            ipcRenderer.send("win-maximize");
        }
    });

    quit!.addEventListener("click", () => {
        if (ipcRenderer.sendSync("minimizeToTray") === true) {
            ipcRenderer.send("win-hide");
        } else if (ipcRenderer.sendSync("minimizeToTray") === false) {
            ipcRenderer.send("win-quit");
        }
    });
}
