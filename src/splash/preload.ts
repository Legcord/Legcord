import {contextBridge, ipcRenderer} from "electron";

contextBridge.exposeInMainWorld("internal", {
    restart: () => ipcRenderer.send("restart"),
    installState: ipcRenderer.sendSync("modInstallState"),
    version: ipcRenderer.sendSync("get-app-version", "app-version"),
    getLang: (toGet: string) =>
        ipcRenderer.invoke("getLang", toGet).then((result) => {
            return result;
        }),
    splashEnd: () => ipcRenderer.send("splashEnd")
});
