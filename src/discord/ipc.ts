//ipc stuff
import {app, clipboard, desktopCapturer, ipcMain, nativeImage, shell} from "electron";
import {mainWindow} from "./window";

import os from "os";
import fs from "fs";
import path from "path";
import {getConfig, setConfigBulk, getConfigLocation, Settings} from "../common/config";
import {setLang, getLang, getLangName} from "../common/lang";
import {sleep} from "../common/sleep";
import {getVersion, getDisplayVersion} from "../common/version";
import {customTitlebar} from "../main";
import {createSettingsWindow} from "../settings/main";
import {splashWindow} from "../splash/main";
import {createTManagerWindow} from "../themeManager/main";
import {modInstallState} from "./extensions/mods";

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
                    let image = nativeImage.createFromPath(path.join(import.meta.dirname, "../", `/assets/ping.png`));
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
    ipcMain.on("splashEnd", async () => {
        splashWindow.close();
        if (await getConfig("startMinimized")) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
    ipcMain.on("restart", () => {
        app.relaunch();
        app.exit();
    });
    ipcMain.on("saveSettings", (_event, args) => {
        setConfigBulk(args);
    });
    ipcMain.on("minimizeToTray", async (event) => {
        event.returnValue = await getConfig("minimizeToTray");
    });
    ipcMain.on("channel", async (event) => {
        event.returnValue = await getConfig("channel");
    });
    ipcMain.on("clientmod", async (event) => {
        event.returnValue = await getConfig("mods");
    });
    ipcMain.on("legacyCapturer", async (event) => {
        event.returnValue = await getConfig("useLegacyCapturer");
    });
    ipcMain.on("trayIcon", async (event) => {
        event.returnValue = await getConfig("trayIcon");
    });
    ipcMain.on("disableAutogain", async (event) => {
        event.returnValue = await getConfig("disableAutogain");
    });
    ipcMain.on("titlebar", (event) => {
        event.returnValue = customTitlebar;
    });
    ipcMain.on("mobileMode", async (event) => {
        event.returnValue = await getConfig("mobileMode");
    });
    ipcMain.on("openSettingsWindow", () => {
        createSettingsWindow();
    });
    ipcMain.on("openManagerWindow", () => {
        createTManagerWindow();
    });
    ipcMain.on("setting-armcordCSP", async (event) => {
        if (await getConfig("armcordCSP")) {
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
    ipcMain.on("openStorageFolder", async () => {
        shell.showItemInFolder(storagePath);
        await sleep(1000);
    });
    ipcMain.on("openThemesFolder", async () => {
        shell.showItemInFolder(themesPath);
        await sleep(1000);
    });
    ipcMain.on("openPluginsFolder", async () => {
        shell.showItemInFolder(pluginsPath);
        await sleep(1000);
    });
    ipcMain.on("openCrashesFolder", async () => {
        shell.showItemInFolder(path.join(app.getPath("temp"), `${app.getName()} Crashes`));
        await sleep(1000);
    });
    ipcMain.on("getLangName", async (event) => {
        event.returnValue = await getLangName();
    });
    ipcMain.on("crash", () => {
        process.crash();
    });
    ipcMain.handle("getSetting", (_event, toGet: keyof Settings) => {
        return getConfig(toGet);
    });
    ipcMain.on("copyDebugInfo", () => {
        let settingsFileContent = fs.readFileSync(getConfigLocation(), "utf-8");
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
