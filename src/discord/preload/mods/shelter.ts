import { ipcRenderer, webFrame } from "electron";
import type { ModBundle } from "../../../@types/ModBundle.js";

const requiredPlugins: Record<string, [string, { isVisible: boolean; allowedActions: Record<string, true> }]> = {
    // "armcord-arrpc": "armcord://plugins/armcordRPC/",
    "armcord-settings": [
        "armcord://plugins/armcordSettings/",
        { isVisible: false, allowedActions: {} }
    ],
    "armcord-screenshare": [
        "armcord://plugins/screenshareQualityFix/",
        { isVisible: true, allowedActions: { toggle: true } }
    ],
};
try {
    await ipcRenderer.invoke("getShelterBundle").then(async (bundle: ModBundle) => {
        if (bundle.enabled) {
            await webFrame.executeJavaScript(`(()=>{
                const SHELTER_INJECTOR_PLUGINS = ${JSON.stringify(requiredPlugins)};
                ${bundle.js}
            })()`);
        }
    });
} catch (e) {
    console.error(e);
}