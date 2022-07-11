import {ipcRenderer} from "electron";
import {addStyle} from "../utils";
import * as fs from "fs";
import * as path from "path";
export function injectMobileStuff() {
    document.addEventListener("DOMContentLoaded", function (event) {
        const mobileCSS = path.join(__dirname, "../", "/content/css/mobile.css");
        addStyle(fs.readFileSync(mobileCSS, "utf8"));

        var logo = document.getElementById("window-title");
        logo!.addEventListener("click", () => {
            if (ipcRenderer.sendSync("minimizeToTray") === true) {
                ipcRenderer.send("win-hide");
            } else if (ipcRenderer.sendSync("minimizeToTray") === false) {
                ipcRenderer.send("win-quit");
            }
        });
    });
}
