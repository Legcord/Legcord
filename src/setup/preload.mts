import {contextBridge, ipcRenderer} from "electron";
import {injectTitlebar} from "../discord/preload/titlebar.mjs";
import {Settings} from "../types/settings";

injectTitlebar();
contextBridge.exposeInMainWorld("armcordinternal", {
    restart: () => ipcRenderer.send("setup-restart"),
    getOS: ipcRenderer.sendSync("setup-getOS") as string, // String as far as I care.
    saveSettings: (...args: [Settings]) => ipcRenderer.send("setup-saveSettings", ...args),
    getLang: (toGet: string) =>
        ipcRenderer.invoke("setup-getLang", toGet).then((result: string) => {
            return result;
        })
});
