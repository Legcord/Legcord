const { contextBridge, ipcRenderer } = require("electron");

import type { Settings } from "../@types/settings.js";

contextBridge.exposeInMainWorld("setup", {
    restart: () => ipcRenderer.send("setup-restart"),
    os: ipcRenderer.sendSync("setup-getOS") as string,
    saveSettings: (...args: [Settings]) => ipcRenderer.send("setup-saveSettings", ...args),
    getLang: (toGet: string) =>
        ipcRenderer.invoke("setup-getLang", toGet).then((result: string) => {
            return result;
        }),
    getRawLang: () => ipcRenderer.invoke("setup-getRawLang") as Promise<Record<string, string>>,
});

if (ipcRenderer.sendSync("setup-getOS") !== "darwin") {
    document.addEventListener("DOMContentLoaded", () => {
        const css = document.createElement("style");
        css.innerHTML = `.bg { 
            background-image: url("legcord://assets/mockup.jpg"); 
            background-repeat: round;
            height: 100%;
            width: 100%;
            position: absolute;
            outline: 80px solid black;
            -webkit-filter: blur(10px); 
        }`;
        document.head.appendChild(css);
    });
}

declare global {
    interface Window {
        setup: {
            // biome-ignore lint/suspicious/noExplicitAny: needed for settings payload
            saveSettings: (settings: any) => void;
            restart: () => void;
            os: string;
            getLang: (toGet: string) => Promise<string>;
            getRawLang: () => Promise<Record<string, string>>;
        };
    }
}
