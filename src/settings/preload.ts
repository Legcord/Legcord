import {contextBridge, ipcRenderer} from "electron";
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
        }) //jank but works
});
