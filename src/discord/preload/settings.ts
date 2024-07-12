import path from "path";
import fs from "fs";
import {addStyle} from "../../common/dom.js";

const webview = `<webview src="${path.join(
    "file://",
    import.meta.dirname,
    "../",
    "/html/settings.html"
)}" preload="${path.join(
    "file://",
    import.meta.dirname,
    "../",
    "/settings/preload.mjs"
)}" id="inAppSettings" webpreferences="sandbox=false"></webview>`;

export function injectSettings() {
    document.getElementById("webviewSettingsContainer")!.innerHTML = webview;
    document.getElementById("ACsettingsModal")!.style.display = "block";
}

document.addEventListener("DOMContentLoaded", function (_event) {
    const settingsCssPath = path.join(import.meta.dirname, "../", "/css/inAppSettings.css");
    addStyle(fs.readFileSync(settingsCssPath, "utf8"));
    const webview = document.querySelector("webview")!;
    webview.addEventListener("console-message", (e) => {
        console.log("Settings page logged a message:", e as Electron.ConsoleMessageEvent);
    });
});
