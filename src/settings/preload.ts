import {contextBridge, ipcRenderer} from "electron";
console.log("ArmCord Settings")
contextBridge.exposeInMainWorld("settings", {
  save: (...args: any) => ipcRenderer.send("saveSettings", ...args),
  get: (toGet: string) => ipcRenderer.invoke('getSetting', toGet).then((result) => {return result}) //jank but works
});