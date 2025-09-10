import { getDisplayVersion } from "./common/version.js";

import electronUpdater, { type AppUpdater } from 'electron-updater';
import { settings } from "./main.js";

function getAutoUpdater(): AppUpdater {
   // Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
   // It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
   const { autoUpdater } = electronUpdater;
   return autoUpdater;
}

let updater: AppUpdater;

if (getDisplayVersion() !== "Dev Build") {
    updater = getAutoUpdater();
    if (settings.autoUpdate) {
        console.log("Auto update is enabled, checking for updates...");
        updater.checkForUpdatesAndNotify();
    }
    else {
        console.log("Auto update is disabled, setting autoDownload to false. Updates are now manual via HeroUpdater or directly reinstalling.");
        updater.autoDownload = false;
    }
}

export { updater };
