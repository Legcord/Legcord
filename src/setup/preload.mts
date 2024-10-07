import { contextBridge, ipcRenderer } from "electron";
import type { Settings } from "../@types/settings.js";
import { injectTitlebar } from "../discord/preload/titlebar.mjs";

injectTitlebar();
contextBridge.exposeInMainWorld("armcordinternal", {
    restart: () => ipcRenderer.send("setup-restart"),
    getOS: ipcRenderer.sendSync("setup-getOS") as string,
    saveSettings: (...args: [Settings]) => ipcRenderer.send("setup-saveSettings", ...args),
    getLang: (toGet: string) =>
        ipcRenderer.invoke("setup-getLang", toGet).then((result: string) => {
            return result;
        }),
});
