import {ipcRenderer, webFrame} from "electron";
import {sleep} from "../../common/sleep";
const requiredPlugins: Record<string, string> = {
    "armcord-arrpc": "https://armcord.github.io/shelter-plugins/armcordRPC/",
    "armcord-settings": "https://armcord.github.io/shelter-plugins/armcordSettings/",
    "armcord-screenshare": "https://armcord.github.io/shelter-plugins/screenshareQualityFix/"
};
await ipcRenderer.invoke("getShelterBundle").then(async (bundle: string) => {
    await webFrame.executeJavaScript(bundle);
});
async function addPlugins() {
    await sleep(5000).then(async () => {
        for (const plugin in requiredPlugins) {
            console.log(`${plugin}: ${requiredPlugins[plugin]}`);
            const js = `
        window.shelter.plugins.addRemotePlugin(
                "${plugin}",
                "${requiredPlugins[plugin]}"
            );
            window.shelter.plugins.startPlugin("${plugin}")
        `;
            try {
                await webFrame.executeJavaScript(js);
            } catch (e) {
                console.log("Plugin " + plugin + " already injected");
            }
        }
    });
}
if (!ipcRenderer.sendSync("isDev")) void addPlugins();
