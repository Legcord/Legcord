import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { platform } from "node:os";
import { app, session } from "electron";
const pluginFolder = `${app.getPath("userData")}/plugins`;

let prefix = "";

if (!existsSync(pluginFolder)) {
    mkdirSync(pluginFolder);
    console.log("Created missing plugin folder");
}
await app.whenReady().then(() => {
    readdirSync(pluginFolder).forEach(async (file) => {
        try {
            // NOTE - The below type assertion is just what we need from the chrome manifest
            if (platform() === "win32") prefix = "file://";
            const manifest = (await import(`${prefix}${pluginFolder}/${file}/manifest.json`, {
                with: { type: "json" },
            })) as { name: string; author: string; type: "json" };

            void session.defaultSession.loadExtension(`${pluginFolder}/${file}`); // NOTE - Awaiting this will cause plugins to not inject
            console.log(`[Mod loader] Loaded ${manifest.name} made by ${manifest.author}`);
        } catch (err) {
            console.error(err);
        }
    });
});
