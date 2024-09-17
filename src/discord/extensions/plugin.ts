import {readdirSync, existsSync, mkdirSync} from "fs";
import {app, session} from "electron";
const pluginFolder = `${app.getPath("userData")}/plugins`;
if (!existsSync(pluginFolder)) {
    mkdirSync(pluginFolder);
    console.log("Created missing plugin folder");
}
await app.whenReady().then(() => {
    readdirSync(pluginFolder).forEach(async (file) => {
        try {
            // NOTE - The below type assertion is just what we need from the chrome manifest
            const manifest = (await import(`${pluginFolder}/${file}/manifest.json`)) as {name: string; author: string};

            void session.defaultSession.loadExtension(`${pluginFolder}/${file}`); // NOTE - Awaiting this will cause plugins to not inject
            console.log(`[Mod loader] Loaded ${manifest.name} made by ${manifest.author}`);
        } catch (err) {
            console.error(err);
        }
    });
});
