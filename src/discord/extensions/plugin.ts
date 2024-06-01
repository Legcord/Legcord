import fs from "fs";
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
            // NOTE - The below type assertion is just what we need from the chrome manifest
            const pluginFile = JSON.parse(manifest) as {name: string; author: string};
            void session.defaultSession.loadExtension(`${pluginFolder}/${file}`); // REVIEW - Awaiting this will cause plugins to not inject
            console.log(`[Mod loader] Loaded ${pluginFile.name} made by ${pluginFile.author}`);
        } catch (err) {
            console.error(err);
        }
    });
});
