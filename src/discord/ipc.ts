import fs from "fs";
import os from "os";
import path from "path";
import {BrowserWindow, SourcesOptions, app, clipboard, desktopCapturer, ipcMain, shell} from "electron";

import isDev from "electron-is-dev";
import {Settings} from "../@types/settings.js";
import {getConfig, getConfigLocation, setConfig, setConfigBulk} from "../common/config.js";
import {getLang, getLangName, getRawLang, setLang} from "../common/lang.js";
import {getDisplayVersion, getVersion} from "../common/version.js";
import {splashWindow} from "../splash/main.js";
import {createTManagerWindow} from "../themeManager/main.js";

const userDataPath = app.getPath("userData");
const storagePath = path.join(userDataPath, "/storage/");
const themesPath = path.join(userDataPath, "/themes/");
const pluginsPath = path.join(userDataPath, "/plugins/");
const quickCssPath = path.join(userDataPath, "/quickCss.css");

function ifExistsRead(path: string): string {
    if (fs.existsSync(path)) return fs.readFileSync(path, "utf-8");
    else return "";
}

export function registerIpc(passedWindow: BrowserWindow): void {
    ipcMain.handle("getShelterBundle", () => {
        return {
            js: ifExistsRead(path.join(app.getPath("userData"), "shelter.js")),
            enabled: true
        };
    });
    ipcMain.handle("getVencordBundle", () => {
        return {
            js: ifExistsRead(path.join(app.getPath("userData"), "vencord.js")),
            css: ifExistsRead(path.join(app.getPath("userData"), "vencord.css")),
            enabled: getConfig("mods").includes("vencord")
        };
    });
    ipcMain.handle("getEquicordBundle", () => {
        return {
            js: ifExistsRead(path.join(app.getPath("userData"), "equicord.js")),
            css: ifExistsRead(path.join(app.getPath("userData"), "equicord.css")),
            enabled: getConfig("mods").includes("equicord")
        };
    });
    ipcMain.handle("getCustomBundle", () => {
        const enabled = getConfig("mods").includes("custom");
        if (enabled) {
            return {
                js: ifExistsRead(path.join(app.getPath("userData"), "custom.js")),
                css: ifExistsRead(path.join(app.getPath("userData"), "custom.css")),
                enabled
            };
        } else {
            return null;
        }
    });
    ipcMain.on("splashEnd", () => {
        splashWindow.close();
        if (getConfig("startMinimized")) {
            passedWindow.hide();
        } else {
            passedWindow.show();
        }
    });
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
    ipcMain.on("getEntireConfig", (event) => {
        const rawData = fs.readFileSync(getConfigLocation(), "utf-8");
        const returnData = JSON.parse(rawData) as Settings;
        event.returnValue = returnData;
    });
    ipcMain.on("getTranslations", (event) => {
        event.returnValue = getRawLang();
    });
    ipcMain.on("getConfig", (event, arg: keyof Settings) => {
        event.returnValue = getConfig(arg);
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
    ipcMain.on("openStorageFolder", () => {
        shell.showItemInFolder(storagePath);
    });
    ipcMain.on("openThemesFolder", () => {
        shell.showItemInFolder(themesPath);
    });
    ipcMain.on("openPluginsFolder", () => {
        shell.showItemInFolder(pluginsPath);
    });
    ipcMain.on("openQuickCssFile", () => {
        void shell.openPath(quickCssPath);
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
