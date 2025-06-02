import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("legcordProxyConfig", {
    saveProxy: (proxy: string) => ipcRenderer.sendSync("proxy-save", proxy),
    cancelProxy: () => ipcRenderer.sendSync("proxy-cancel"),
    getProxy: () => ipcRenderer.sendSync("proxy-config"),
});

declare global {
    interface Window {
        legcordProxyConfig: {
            saveProxy: (proxy: string | undefined) => void;
            cancelProxy: () => void;
            getProxy: () => string | undefined;
        };
    }
}
