import {addStyle} from "../utils";
import * as fs from "fs";
import * as path from "path";
export function injectTabs() {
    document.addEventListener("DOMContentLoaded", function (event) {
        var elem = document.createElement("div");
        elem.innerHTML = `<nav class="tabs">
          <div id="tabs-controls-container">
              <button class="tabs-buttons" onclick="armcord.openTab(1)">1</button>
              <button class="tabs-buttons" onclick="armcord.openTab(2)">2</button>
              <button class="tabs-buttons" onclick="armcord.openTab(3)">3</button>
              <button class="tabs-buttons" onclick="armcord.openTab(4)">4</button>
              <button class="tabs-buttons" onclick="armcord.openTab(5)">5</button>
              <p class="experimental">Experimental</p>
          </div>
        </nav>`;
        elem.classList.add("withFrame-haYltI");
        if (document.getElementById("app-mount") == null) {
            document.body.appendChild(elem);
        } else {
            document.getElementById("app-mount")!.prepend(elem);
        }
        const cssPath = path.join(__dirname, "../", "/content/css/tabs.css");
        addStyle(fs.readFileSync(cssPath, "utf8"));
    });
}
