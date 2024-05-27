import {addStyle} from "../../common/dom.js";
import fs from "fs";
import path from "path";
export function injectMobileStuff(): void {
    document.addEventListener("DOMContentLoaded", function () {
        const mobileCSS = path.join(import.meta.dirname, "../", "/content/css/mobile.css");
        addStyle(fs.readFileSync(mobileCSS, "utf8"));
        // TO-DO: clicking on the logo, or additional button triggers ESC button to move around the UI quicker
        // var logo = document.getElementById("window-title");
        // logo!.addEventListener("click", () => {
        //
        // });
    });
}
