import {ipcRenderer, webFrame} from "electron";
import type {ModBundle} from "../../../types/ModBundle.d.js";

try {
    await ipcRenderer.invoke("getVencordBundle").then(async (bundle: ModBundle) => {
        if (bundle.enabled) {
            await webFrame.executeJavaScript(bundle.js);
            webFrame.insertCSS(bundle.css!); //NOTE - Vencord requires CSS.
        }
    });
} catch (error) {
    console.error("Vencord Failed to load!");
    console.error(error);
}
