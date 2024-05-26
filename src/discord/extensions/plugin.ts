import * as fs from "fs";
import {app, session} from "electron";
const userDataPath = app.getPath("userData");
const pluginFolder = `${userDataPath}/plugins`;
if (!fs.existsSync(pluginFolder)) {
    fs.mkdirSync(pluginFolder);
    console.log("Created missing plugin folder");
}
await app.whenReady().then(() => {
    fs.readdirSync(pluginFolder).forEach((file) => {
        try {
            const manifest = fs.readFileSync(`${pluginFolder}/${file}/manifest.json`, "utf8");
            const pluginFile = JSON.parse(manifest);
            void session.defaultSession.loadExtension(`${pluginFolder}/${file}`); // REVIEW - Awaiting this will cause plugins to not inject
            console.log(`[Mod loader] Loaded ${pluginFile.name} made by ${pluginFile.author}`);
        } catch (err) {
            console.error(err);
        }
    });
});
