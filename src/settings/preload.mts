import {contextBridge, ipcRenderer} from "electron";
import {Settings} from "../types/settings";
//import {addStyle} from "../utils.js";
console.log("ArmCord Settings");
console.log(process.platform);
contextBridge.exposeInMainWorld("settings", {
    // REVIEW - this may be typed incorrectly, I'm not sure how "..." works
    save: (...args: Settings[]) => ipcRenderer.send("saveSettings", ...args),
    restart: () => ipcRenderer.send("restart"),
    // REVIEW - I couldn't find a reference to anything about the below function
    saveAlert: (restartFunc: () => void) => ipcRenderer.send("saveAlert", restartFunc),
    getLang: (toGet: string) => ipcRenderer.invoke("getLang", toGet),
    get: (toGet: string) => ipcRenderer.invoke("getSetting", toGet),
    openThemesFolder: () => ipcRenderer.send("openThemesFolder"),
    openPluginsFolder: () => ipcRenderer.send("openPluginsFolder"),
    openStorageFolder: () => ipcRenderer.send("openStorageFolder"),
    openCrashesFolder: () => ipcRenderer.send("openCrashesFolder"),
    copyDebugInfo: () => ipcRenderer.send("copyDebugInfo"),
    copyGPUInfo: () => ipcRenderer.send("copyGPUInfo"),
    crash: () => ipcRenderer.send("crash"),
    os: process.platform
});
/*
ipcRenderer.on("themeLoader", (_event, message) => {
    //addStyle(message);
});
*/
