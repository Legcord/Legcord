const { contextBridge, ipcRenderer } = require("electron");
import type { Settings } from "../@types/settings.js";

const setupOS = ipcRenderer.sendSync("setup-getOS") as string;

contextBridge.exposeInMainWorld("setup", {
    restart: () => ipcRenderer.send("setup-restart"),
    os: setupOS,
    saveSettings: (...args: [Settings]) => ipcRenderer.send("setup-saveSettings", ...args),
    getLang: (toGet: string) =>
        ipcRenderer.invoke("setup-getLang", toGet).then((result: string) => {
            return result;
        }),
});

if (setupOS !== "darwin") {
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
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            saveSettings: (settings: any) => void;
            restart: () => void;
            os: string;
        };
    }
}
