import {ipcRenderer, webFrame} from "electron";
import type {ModBundle} from "../../../@types/ModBundle.js";

try {
    await ipcRenderer.invoke("getCustomBundle").then(async (bundle: ModBundle) => {
        if (bundle.enabled) {
            await webFrame.executeJavaScript(bundle.js);
            if (bundle.css) {
                webFrame.insertCSS(bundle.css); //NOTE - Custom mods might require CSS.
            }
        }
    });
} catch (error) {
    console.error("Custom bundle failed to load!");
    console.error(error);
}
