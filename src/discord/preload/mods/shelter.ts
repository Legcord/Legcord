import {ipcRenderer, webFrame} from "electron";
import {sleep} from "../../../common/sleep.js";
import type {ModBundle} from "../../../types/ModBundle.d.js";
import {readFileSync} from "fs";
import {join} from "path";
const requiredPlugins: string[] = ["armcordRPC", "armcordSettings", "screenshareQualityFix"];
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
    if (ipcRenderer.sendSync("isDev")) {
        await sleep(5000).then(async () => {
            for (const plugin of requiredPlugins) {
                console.log(`Adding ${plugin}`);
                const bundle = readFileSync(
                    join(import.meta.dirname, "../", `/plugins/${plugin}/plugin.js`),
                    "utf8"
                ).replace('"use strict";', "");
                const manifest = readFileSync(
                    join(import.meta.dirname, "../", `/plugins/${plugin}/plugin.json`),
                    "utf8"
                );

                const js = `
            async function install() {
                var installed = shelter.plugins.installedPlugins();
                if (installed["${plugin}"]) {
                    window.shelter.plugins.startPlugin("${plugin}");
                } else {
                    window.shelter.plugins.addLocalPlugin("${plugin}", {
                    js: \`${bundle}\`,
                    update: false,
                    manifest: ${manifest}
                });
                    await new Promise(r => setTimeout(r, 2000));
                    window.shelter.plugins.startPlugin("${plugin}");
            }}
            install()
        `;
                console.log(js);
                try {
                    await webFrame.executeJavaScript(js);
                } catch (_e) {
                    console.log("Plugin " + plugin + " already injected");
                }
            }
        });
    }
}
void addPlugins();
