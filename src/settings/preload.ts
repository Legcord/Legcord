import {contextBridge, ipcRenderer} from "electron";
import * as path from "path";
import {addStyle} from "../utils";
import fs from "fs";
console.log("ArmCord Settings");

contextBridge.exposeInMainWorld("settings", {
    save: (...args: any) => ipcRenderer.send("saveSettings", ...args),
    getLang: (toGet: string) =>
        ipcRenderer.invoke("getLang", toGet).then((result) => {
            return result;
        }),
    get: (toGet: string) =>
        ipcRenderer.invoke("getSetting", toGet).then((result) => {
            return result;
        }), //jank but works
    openThemesFolder: () => ipcRenderer.send("openThemesFolder"),
    openPluginsFolder: () => ipcRenderer.send("openPluginsFolder"),
    openStorageFolder: () => ipcRenderer.send("openStorageFolder"),
    copyDebugInfo: () => ipcRenderer.send("copyDebugInfo")
});
if (ipcRenderer.sendSync("getLangName") == "en-US") {
    console.log("[Settings]: Lang " + ipcRenderer.sendSync("getLangName"));
    const cssPath = path.join(__dirname, "../", "/content/css/settingsEng.css");
    document.addEventListener("DOMContentLoaded", function (event) {
        addStyle(fs.readFileSync(cssPath, "utf8"));
    });
}
ipcRenderer.on("themeLoader", (event, message) => {
    addStyle(message);
});
