import { readFileSync } from "node:fs";
import { platform } from "node:os";
import { join } from "node:path";
import { ipcRenderer } from "electron";
import type { Settings } from "../../@types/settings.js";
import { addStyle } from "../../common/dom.js";
const titlebarHTML = `<nav class="titlebar">
          <div class="window-title" id="window-title"></div>
          <div id="window-controls-container">
              <div id="spacer"></div>
              <div id="minimize"><div id="minimize-icon"></div></div>
              <div id="maximize"><div id="maximize-icon"></div></div>
              <div id="quit"><div id="quit-icon"></div></div>
          </div>
        </nav>`;
const titlebarOverlayHTML = `<nav class="titlebar">
          <div class="window-title" id="window-title"></div>
        </nav>`;
export function injectTitlebar(isOverlay?: boolean): void {
    window.onload = () => {
        const elem = document.createElement("div");
        if (isOverlay) {
            elem.innerHTML = titlebarOverlayHTML;
        } else {
            elem.innerHTML = titlebarHTML;
        }
        elem.classList.add("withFrame-haYltI");
        if (document.getElementById("app-mount") == null) {
            document.body.appendChild(elem);
        } else {
            document.getElementById("app-mount")!.prepend(elem);
        }
        const titlebarcssPath = join(import.meta.dirname, "../", "/css/titlebar.css");
        const wordmarkcssPath = join(import.meta.dirname, "../", "/css/logos.css");
        addStyle(readFileSync(titlebarcssPath, "utf8"));
        addStyle(readFileSync(wordmarkcssPath, "utf8"));
        document.body.setAttribute("customTitlebar", "");

        document.body.setAttribute("armcord-platform", platform());

        const minimize = document.getElementById("minimize");
        const maximize = document.getElementById("maximize");
        const quit = document.getElementById("quit");

        minimize!.addEventListener("click", () => {
            if (window.location.href.includes("setup.html")) {
                ipcRenderer.send("setup-minimize");
            } else {
                ipcRenderer.send("win-minimize");
            }
        });

        maximize!.addEventListener("click", () => {
            if (ipcRenderer.sendSync("win-isMaximized") === true) {
                ipcRenderer.send("win-unmaximize");
                document.body.removeAttribute("isMaximized");
            } else if (ipcRenderer.sendSync("win-isNormal") === true) {
                ipcRenderer.send("win-maximize");
            }
        });
        const minimizeToTray = ipcRenderer.sendSync("getConfig", "minimizeToTray") as Settings["minimizeToTray"];
        quit!.addEventListener("click", () => {
            if (window.location.href.includes("setup.html")) {
                ipcRenderer.send("setup-quit");
            } else {
                if (minimizeToTray === true) {
                    ipcRenderer.send("win-hide");
                } else if (minimizeToTray === false) {
                    ipcRenderer.send("win-quit");
                }
            }
        });
    };
}
