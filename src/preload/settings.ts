import * as path from "path";
import * as fs from "fs";
import {addScript, addStyle} from "../utils";
import {WebviewTag} from "electron";

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

document.addEventListener("DOMContentLoaded", function (_event) {
    const settingsCssPath = path.join(__dirname, "../", "/content/css/inAppSettings.css");
    addStyle(fs.readFileSync(settingsCssPath, "utf8"));
    const webview = document.querySelector("webview") as WebviewTag;
    webview.addEventListener("console-message", (e) => {
        console.log("Settings page logged a message:", e.message);
    });
});
