import {ipcRenderer, webFrame} from "electron";
import type {ModBundle} from "../../../@types/ModBundle.js";
import {sleep} from "../../../common/sleep.js";
const requiredPlugins: Record<string, string> = {
    // "armcord-arrpc": "armcord://plugins/armcordRPC/",
    "armcord-settings": "armcord://plugins/armcordSettings/",
    "armcord-screenshare": "armcord://plugins/screenshareQualityFix/"
};
try {
    await ipcRenderer.invoke("getShelterBundle").then(async (bundle: ModBundle) => {
        if (bundle.enabled) {
            await webFrame.executeJavaScript(bundle.js);
        }
    });
} catch (e) {
    console.error(e);
}
async function addPlugins() {
    await sleep(5000).then(async () => {
        for (const plugin in requiredPlugins) {
            console.log(`${plugin}: ${requiredPlugins[plugin]}`);
            const js = `
            async function install() {
                var installed = shelter.plugins.installedPlugins();
                if (installed["${plugin}"]) {
                    window.shelter.plugins.startPlugin("${plugin}");
                } else {
                    window.shelter.plugins.addRemotePlugin(
                        "${plugin}",
                        "${requiredPlugins[plugin]}"
                    );
                    await new Promise(r => setTimeout(r, 2000));
                    window.shelter.plugins.startPlugin("${plugin}");
            }}
            install()
        `;
            try {
                await webFrame.executeJavaScript(js);
            } catch (_e) {
                console.log("Plugin " + plugin + " already injected");
            }
        }
    });
}
void addPlugins();
