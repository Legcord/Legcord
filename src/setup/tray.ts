import { unlink } from "node:fs";
import { join } from "node:path";
import { Menu, Tray, app, nativeImage } from "electron";
import { getConfig, getConfigLocation } from "../common/config.js";

export let tray: Tray;
const trayIcon = "ac_plug_colored";
void app.whenReady().then(() => {
    const trayPath = nativeImage.createFromPath(join(import.meta.dirname, "../", `/assets/${trayIcon}.png`));
    switch (process.platform) {
        case "win32":
            trayPath.resize({ height: 16 });
            break;
        case "darwin":
            trayPath.resize({ height: 18 });
            break;
        case "linux":
            trayPath.resize({ height: 24 });
            break;
        default:
            trayPath;
            break;
    }
    const clientName = getConfig("clientName") ?? "Legcord";
    tray = new Tray(trayPath);
    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Finish the setup first!",
            enabled: false,
        },
        {
            label: `Quit ${clientName}`,
            click() {
                unlink(getConfigLocation(), (err) => {
                    if (err) throw err;

                    console.log('Closed during setup. "settings.json" was deleted');
                    app.quit();
                });
            },
        },
    ]);
    tray.setContextMenu(contextMenu);
});
