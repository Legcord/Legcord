import * as path from "path";
import * as fs from "fs";
import {addStyle} from "../utils";
import {WebviewTag} from "electron";
var html = `
<div id="ACsettingsModal" class="ACsettings-modal">
<span class="close" id="closeSettings">&times;</span>
<div class="ACsettings-modal-content" id="webviewSettingsContainer">
</div>
</div>`;

var webview = `<webview src="${path.join("file://", __dirname, "../", "/settings/settings.html")}" preload="${path.join(
    "file://",
    __dirname,
    "../",
    "/settings/preload.js"
)}" id="inAppSettings"></webview>`;
export function injectSettings() {
    document.getElementById("webviewSettingsContainer")!.innerHTML = webview;
    document.getElementById("ACsettingsModal")!.style.display = "block";
}
function removeSettings() {
    document.getElementById("webviewSettingsContainer")!.innerHTML = "";
    document.getElementById("ACsettingsModal")!.style.display = "none";
}
document.addEventListener("DOMContentLoaded", function (_event) {
    const elem = document.createElement("div");
    elem.innerHTML = html;
    elem.classList.add("withFrame-haYltI");
    if (document.getElementById("app-mount") == null) {
        document.body.appendChild(elem);
    } else {
        document.getElementById("app-mount")!.prepend(elem);
    }
    const settingsCssPath = path.join(__dirname, "../", "/content/css/inAppSettings.css");
    addStyle(fs.readFileSync(settingsCssPath, "utf8"));
    document.getElementById("closeSettings")!.addEventListener("click", () => {
        removeSettings();
    });
    const webview = document.querySelector("webview") as WebviewTag;
    webview.addEventListener("console-message", (e) => {
        console.log("Settings page logged a message:", e.message);
    });
});
