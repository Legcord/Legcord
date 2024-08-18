import {app, clipboard, desktopCapturer, ipcMain, shell, SourcesOptions, BrowserWindow} from "electron";
import os from "os";
import fs from "fs";
import path from "path";
import {mainWindows} from "./window.js";
import {getConfig, setConfigBulk, getConfigLocation, setConfig} from "../common/config.js";
import {setLang, getLang, getLangName, getRawLang} from "../common/lang.js";
import {getVersion, getDisplayVersion} from "../common/version.js";
import {customTitlebar} from "../main.js";
import {splashWindow} from "../splash/main.js";
import {createTManagerWindow} from "../themeManager/main.js";
import {Settings} from "../types/settings.d.js";
import isDev from "electron-is-dev";

const userDataPath = app.getPath("userData");
const storagePath = path.join(userDataPath, "/storage/");
const themesPath = path.join(userDataPath, "/themes/");
const pluginsPath = path.join(userDataPath, "/plugins/");
export function registerIpc(passedWindow: BrowserWindow): void {
    ipcMain.handle("getShelterBundle", () => {
        return {
            js: fs.readFileSync(path.join(app.getPath("userData"), "shelter.js"), "utf-8"),
            enabled: true
        };
    });
    ipcMain.handle("getVencordBundle", () => {
        return {
            js: fs.readFileSync(path.join(app.getPath("userData"), "vencord.js"), "utf-8"),
            css: fs.readFileSync(path.join(app.getPath("userData"), "vencord.css"), "utf-8"),
            enabled: getConfig("mods").includes("vencord")
        };
    });
    ipcMain.on("splashEnd", () => {
        splashWindow.close();
        if (getConfig("startMinimized")) {
            passedWindow.hide();
        } else {
            passedWindow.show();
        }
    });

    if (mainWindows.length !== 1) {
        return;
    }

    ipcMain.on("setLang", (_event, lang: string) => {
        setLang(lang);
    });
    ipcMain.on("getLangSync", (event, toGet: string) => {
        event.reply("langString", getLang(toGet));
    });
    ipcMain.handle("getLang", (_event, toGet: string) => {
        return getLang(toGet);
    });

    ipcMain.on("win-maximize", () => {
        passedWindow.maximize();
    });
    ipcMain.on("win-isMaximized", (event) => {
        event.returnValue = passedWindow.isMaximized();
    });
    ipcMain.on("win-isNormal", (event) => {
        event.returnValue = passedWindow.isNormal();
    });
    ipcMain.on("win-minimize", () => {
        passedWindow.minimize();
    });
    ipcMain.on("win-unmaximize", () => {
        passedWindow.unmaximize();
    });
    ipcMain.on("win-show", () => {
        passedWindow.show();
    });
    ipcMain.on("win-hide", () => {
        passedWindow.hide();
    });
    ipcMain.on("win-quit", () => {
        app.quit();
    });
    ipcMain.on("get-app-version", (event) => {
        event.returnValue = getVersion();
    });
    ipcMain.on("displayVersion", (event) => {
        event.returnValue = getDisplayVersion();
    });
    ipcMain.on("restart", () => {
        app.relaunch();
        app.exit();
    });
    ipcMain.on("isDev", (event) => {
        event.returnValue = isDev;
    });
    ipcMain.on("setConfig", (_event, key: keyof Settings, value: string) => {
        setConfig(key, value);
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
    ipcMain.on("getEntireConfig", (event) => {
        const rawData = fs.readFileSync(getConfigLocation(), "utf-8");
        const returnData = JSON.parse(rawData) as Settings;
        event.returnValue = returnData;
    });
    ipcMain.on("getTranslations", (event) => {
        event.returnValue = getRawLang();
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
    ipcMain.on("openThemesWindow", () => {
        void createTManagerWindow();
    });
    // NOTE - I assume this would return sources based on the fact that the function only ingests sources
    ipcMain.handle("DESKTOP_CAPTURER_GET_SOURCES", (_event, opts: SourcesOptions) => desktopCapturer.getSources(opts));
    ipcMain.on("saveSettings", (_event, args: Settings) => {
        console.log(args);
        setConfigBulk(args);
    });
    // NOTE - The lower 4 functions had await sleep(1000), I'm not sure why. Behavior is same regardless
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
