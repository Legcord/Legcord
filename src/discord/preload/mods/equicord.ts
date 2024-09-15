import {ipcRenderer, webFrame} from "electron";
import type {ModBundle} from "../../../@types/ModBundle.js";

try {
    await ipcRenderer.invoke("getEquicordBundle").then(async (bundle: ModBundle) => {
        if (bundle.enabled) {
            await webFrame.executeJavaScript(bundle.js);
            webFrame.insertCSS(bundle.css!); //NOTE - Equicord requires CSS.
        }
    });
} catch (error) {
    console.error("Equicord Failed to load!");
    console.error(error);
}
