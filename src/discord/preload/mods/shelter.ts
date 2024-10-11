import { ipcRenderer, webFrame } from "electron";
import type { ModBundle } from "../../../@types/ModBundle.js";

const requiredPlugins: Record<string, [string, { isVisible: boolean; allowedActions: Record<string, true> }]> = {
    // "legcord-arrpc": "legcord://plugins/rpc/",
    "legcord-settings": ["legcord://plugins/settings/", { isVisible: false, allowedActions: {} }],
    "legcord-screenshare": [
        "legcord://plugins/screenshareQualityFix/",
        { isVisible: true, allowedActions: { toggle: true } },
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
