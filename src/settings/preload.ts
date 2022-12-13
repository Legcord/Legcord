import {contextBridge, ipcRenderer} from "electron";
import {addStyle} from "../utils";
console.log("ArmCord Settings");

contextBridge.exposeInMainWorld("settings", {
    save: (...args: any) => ipcRenderer.send("saveSettings", ...args),
    restart: () => ipcRenderer.send("restart"),
    saveAlert: (restartFunc: any) => ipcRenderer.send("saveAlert", restartFunc),
    getLang: (toGet: string) => ipcRenderer.invoke("getLang", toGet),
    get: (toGet: string) => ipcRenderer.invoke("getSetting", toGet),
    openThemesFolder: () => ipcRenderer.send("openThemesFolder"),
    openPluginsFolder: () => ipcRenderer.send("openPluginsFolder"),
    openStorageFolder: () => ipcRenderer.send("openStorageFolder"),
    openCrashesFolder: () => ipcRenderer.send("openCrashesFolder"),
    copyDebugInfo: () => ipcRenderer.send("copyDebugInfo"),
    crash: () => ipcRenderer.send("crash")
});

ipcRenderer.on("themeLoader", (event, message) => {
    addStyle(message);
});
