import {ipcRenderer, webFrame} from "electron";
import {ModBundle} from "../../../types/ModBundle.d.js";

try {
    await ipcRenderer.invoke("getBetterDiscordBundle").then(async (bundle: ModBundle) => {
        if (bundle.enabled) {
            await webFrame.executeJavaScript(bundle.js);
        }
    });
} catch (error) {
    console.error("BetterDiscord Failed to load!");
    console.error(error);
}
