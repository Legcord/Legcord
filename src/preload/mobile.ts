import {ipcRenderer} from "electron";
import {addStyle} from "../utils";
import * as fs from "fs";
import * as path from "path";
export function injectMobileStuff() {
    document.addEventListener("DOMContentLoaded", function (event) {
        const mobileCSS = path.join(__dirname, "../", "/content/css/mobile.css");
        addStyle(fs.readFileSync(mobileCSS, "utf8"));
        // TO-DO: clicking on the logo, or additional button triggers ESC button to move around the UI quicker
        // var logo = document.getElementById("window-title");
        // logo!.addEventListener("click", () => {
        //
        // });
    });
}
