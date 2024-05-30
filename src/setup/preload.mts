import {contextBridge, ipcRenderer} from "electron";
import {injectTitlebar} from "../discord/preload/titlebar.mjs";

injectTitlebar();
contextBridge.exposeInMainWorld("armcordinternal", {
    restart: () => ipcRenderer.send("restart"),
    getOS: ipcRenderer.sendSync("setup-getOS"),
    saveSettings: (...args: any) => ipcRenderer.send("saveSettings", ...args),
    getLang: (toGet: string) =>
        ipcRenderer.invoke("getLang", toGet).then((result) => {
            return result;
        })
});
