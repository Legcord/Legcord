import * as fs from "fs";
import {app, session} from "electron";
const userDataPath = app.getPath("userData");
const pluginFolder = userDataPath + "/plugins/";
if (!fs.existsSync(pluginFolder)) {
    fs.mkdirSync(pluginFolder);
    console.log("Created missing plugin folder");
}
app.whenReady().then(() => {
    fs.readdirSync(pluginFolder).forEach((file) => {
        try {
            const manifest = fs.readFileSync(`${userDataPath}/plugins/${file}/manifest.json`, "utf8");
            var pluginFile = JSON.parse(manifest);
            session.defaultSession.loadExtension(`${userDataPath}/plugins/${file}`);
            console.log(`[Mod loader] Loaded ${pluginFile.name} made by ${pluginFile.author}`);
        } catch (err) {
            console.error(err);
        }
    });
});
