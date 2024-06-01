//ipc stuff
import {app, clipboard, desktopCapturer, ipcMain, nativeImage, shell} from "electron";
import {mainWindow} from "./window.js";

import os from "os";
import fs from "fs";
import path from "path";
import {getConfig, setConfigBulk, getConfigLocation} from "../common/config.js";
import {setLang, getLang, getLangName} from "../common/lang.js";
import {getVersion, getDisplayVersion} from "../common/version.js";
import {customTitlebar} from "../main.js";
import {createSettingsWindow} from "../settings/main.js";
import {splashWindow} from "../splash/main.js";
import {createTManagerWindow} from "../themeManager/main.js";
import {modInstallState} from "./extensions/mods.js";
import {Settings} from "../types/settings.d.js";

const userDataPath = app.getPath("userData");
const storagePath = path.join(userDataPath, "/storage/");
const themesPath = path.join(userDataPath, "/themes/");
const pluginsPath = path.join(userDataPath, "/plugins/");
export function registerIpc(): void {
    ipcMain.on("get-app-path", (event) => {
        event.reply("app-path", app.getAppPath());
    });
    ipcMain.on("setLang", (_event, lang: string) => {
        setLang(lang);
    });
    ipcMain.handle("getLang", (_event, toGet: string) => {
        return getLang(toGet);
    });
    ipcMain.on("open-external-link", (_event, href: string) => {
        void shell.openExternal(href);
    });
    ipcMain.on("setPing", (_event, pingCount: number) => {
        switch (os.platform()) {
            case "linux" ?? "macos":
                app.setBadgeCount(pingCount);
                break;
            case "win32":
                if (pingCount > 0) {
                    const image = nativeImage.createFromPath(path.join(import.meta.dirname, "../", `/assets/ping.png`));
                    mainWindow.setOverlayIcon(image, "badgeCount");
                } else {
                    mainWindow.setOverlayIcon(null, "badgeCount");
                }
                break;
        }
    });
    ipcMain.on("win-maximize", () => {
        mainWindow.maximize();
    });
    ipcMain.on("win-isMaximized", (event) => {
        event.returnValue = mainWindow.isMaximized();
    });
    ipcMain.on("win-isNormal", (event) => {
        event.returnValue = mainWindow.isNormal();
    });
    ipcMain.on("win-minimize", () => {
        mainWindow.minimize();
    });
    ipcMain.on("win-unmaximize", () => {
        mainWindow.unmaximize();
    });
    ipcMain.on("win-show", () => {
        mainWindow.show();
    });
    ipcMain.on("win-hide", () => {
        mainWindow.hide();
    });
    ipcMain.on("win-quit", () => {
        app.exit();
    });
    ipcMain.on("get-app-version", (event) => {
        event.returnValue = getVersion();
    });
    ipcMain.on("displayVersion", (event) => {
        event.returnValue = getDisplayVersion();
    });
    ipcMain.on("modInstallState", (event) => {
        event.returnValue = modInstallState;
    });
    ipcMain.on("splashEnd", () => {
        splashWindow.close();
        if (getConfig("startMinimized")) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
    ipcMain.on("restart", () => {
        app.relaunch();
        app.exit();
    });
    ipcMain.on("saveSettings", (_event, args: Settings) => {
        setConfigBulk(args);
    });
    ipcMain.on("minimizeToTray", (event) => {
        event.returnValue = getConfig("minimizeToTray");
    });
    ipcMain.on("channel", (event) => {
        event.returnValue = getConfig("channel");
    });
    ipcMain.on("clientmod", (event) => {
        event.returnValue = getConfig("mods");
    });
    ipcMain.on("legacyCapturer", (event) => {
        event.returnValue = getConfig("useLegacyCapturer");
    });
    ipcMain.on("trayIcon", (event) => {
        event.returnValue = getConfig("trayIcon");
    });
    ipcMain.on("disableAutogain", (event) => {
        event.returnValue = getConfig("disableAutogain");
    });
    ipcMain.on("titlebar", (event) => {
        event.returnValue = customTitlebar;
    });
    ipcMain.on("mobileMode", (event) => {
        event.returnValue = getConfig("mobileMode");
    });
    // REVIEW - I don't see a reason to await the actual action of running the settings window. The user cannot open more than one anyway, as defined in the function.
    ipcMain.on("openSettingsWindow", () => {
        void createSettingsWindow();
    });
    ipcMain.on("openManagerWindow", () => {
        void createTManagerWindow();
    });
    ipcMain.on("setting-armcordCSP", (event) => {
        if (getConfig("armcordCSP")) {
            event.returnValue = true;
        } else {
            event.returnValue = false;
        }
    });
    ipcMain.handle("DESKTOP_CAPTURER_GET_SOURCES", (_event, opts) => desktopCapturer.getSources(opts));
    ipcMain.on("saveSettings", (_event, args: Settings) => {
        console.log(args);
        setConfigBulk(args);
    });
    // REVIEW - The lower 4 functions had await sleep(1000), I'm not sure why. Behavior is same regardless
    ipcMain.on("openStorageFolder", () => {
        shell.showItemInFolder(storagePath);
    });
    ipcMain.on("openThemesFolder", () => {
        shell.showItemInFolder(themesPath);
    });
    ipcMain.on("openPluginsFolder", () => {
        shell.showItemInFolder(pluginsPath);
    });
    ipcMain.on("openCrashesFolder", () => {
        shell.showItemInFolder(path.join(app.getPath("temp"), `${app.getName()} Crashes`));
    });
    ipcMain.on("getLangName", (event) => {
        event.returnValue = getLangName();
    });
    ipcMain.on("crash", () => {
        process.crash();
    });
    ipcMain.handle("getSetting", (_event, toGet: keyof Settings) => {
        return getConfig(toGet);
    });
    ipcMain.on("copyDebugInfo", () => {
        const settingsFileContent = fs.readFileSync(getConfigLocation(), "utf-8");
        clipboard.writeText(
            `**OS:** ${os.platform()} ${os.version()}\n**Architecture:** ${os.arch()}\n**ArmCord version:** ${getVersion()}\n**Electron version:** ${
                process.versions.electron
            }\n\`${settingsFileContent}\``
        );
    });
    ipcMain.on("copyGPUInfo", () => {
        clipboard.writeText(JSON.stringify(app.getGPUFeatureStatus()));
    });
}
