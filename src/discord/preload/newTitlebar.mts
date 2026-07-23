const { ipcRenderer } = require("electron");

import { addStyle } from "../../common/dom.js";
import { sleep } from "../../common/sleep.js";

const windowStyle = ipcRenderer.sendSync("getConfig", "windowStyle") as string;
const transparency = ipcRenderer.sendSync("getConfig", "transparency") as string;
const os = ipcRenderer.sendSync("getOS") as string;

// Native + transparency on macOS uses overlay chrome (see createWindow / Legcord#1095).
const usesOverlayChrome =
    windowStyle === "default" ||
    windowStyle === "overlay" ||
    (windowStyle === "native" && os === "darwin" && transparency !== "none");

if (usesOverlayChrome) {
    document.addEventListener("DOMContentLoaded", () => {
        document.body.setAttribute("legcord-platform", os);
        addStyle("legcord://assets/css/baseTitlebar.css");
        sleep(500);
        switch (os) {
            case "darwin":
                // breaks traffic lights with bar__ and hidden__ classes
                // document.body.setAttribute("class", "platform-osx");
                addStyle("legcord://assets/css/darwinTitlebar.css");
                break;
            case "win32":
                document.body.setAttribute("class", "platform-win");
                addStyle("legcord://assets/css/winTitlebar.css");
                break;
            case "linux":
                document.body.setAttribute("class", "platform-linux");
                addStyle("legcord://assets/css/linuxTitlebar.css");
                break;
            default:
                break;
        }
    });
}
