import {ipcRenderer, webFrame} from "electron";

await ipcRenderer.invoke("getShelterBundle").then(async (bundle: string) => {
    await webFrame.executeJavaScript(bundle);
});
