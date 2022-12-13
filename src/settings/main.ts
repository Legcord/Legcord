import {BrowserWindow, shell, ipcMain, app, clipboard} from "electron";
import {
    checkForDataFolder,
    getConfig,
    setConfigBulk,
    Settings,
    getLang,
    getVersion,
    getConfigLocation,
    getLangName,
    sleep,
    getDisplayVersion
} from "../utils";
import path from "path";
import os from "os";
import fs from "fs";
import {mainWindow} from "../window";
import {crash} from "process";
var settingsWindow: BrowserWindow;
var instance: number = 0;
//checkForDataFolder();
const userDataPath = app.getPath("userData");
const storagePath = path.join(userDataPath, "/storage/");
const themesPath = path.join(userDataPath, "/themes/");
const pluginsPath = path.join(userDataPath, "/plugins/");
export function createSettingsWindow() {
    console.log("Creating a settings window.");
    instance = instance + 1;
    if (instance > 1) {
        if (settingsWindow) {
            settingsWindow.show();
            settingsWindow.restore();
        }
    } else {
        settingsWindow = new BrowserWindow({
            width: 660,
            height: 670,
            title: `ArmCord Settings | Version: ${getDisplayVersion()}`,
            darkTheme: true,
            frame: true,
            autoHideMenuBar: true,
            webPreferences: {
                sandbox: false,
                preload: path.join(__dirname, "preload.js")
            }
        });
        async function settingsLoadPage() {
            if ((await getConfig("channel")) == "hummus") {
                settingsWindow.loadURL(`file://${__dirname}/hummus.html`);
            } else {
                settingsWindow.loadURL(`file://${__dirname}/settings.html`);
            }
        }
        const userDataPath = app.getPath("userData");
        const themesFolder = userDataPath + "/themes/";
        if (!fs.existsSync(themesFolder)) {
            fs.mkdirSync(themesFolder);
            console.log("Created missing theme folder");
        }
        settingsWindow.webContents.on("did-finish-load", () => {
            fs.readdirSync(themesFolder).forEach((file) => {
                try {
                    const manifest = fs.readFileSync(`${themesFolder}/${file}/manifest.json`, "utf8");
                    var themeFile = JSON.parse(manifest);
                    settingsWindow.webContents.send(
                        "themeLoader",
                        fs.readFileSync(`${themesFolder}/${file}/${themeFile.theme}`, "utf-8")
                    );
                    console.log(`%cLoaded ${themeFile.name} made by ${themeFile.author}`, "color:red");
                } catch (err) {
                    console.error(err);
                }
            });
        });
        ipcMain.on("saveSettings", (event, args: Settings) => {
            console.log(args);
            setConfigBulk(args);
        });
        ipcMain.on("openStorageFolder", async (event) => {
            shell.showItemInFolder(storagePath);
            await sleep(1000);
        });
        ipcMain.on("openThemesFolder", async (event) => {
            shell.showItemInFolder(themesPath);
            await sleep(1000);
        });
        ipcMain.on("openPluginsFolder", async (event) => {
            shell.showItemInFolder(pluginsPath);
            await sleep(1000);
        });
        ipcMain.on("openCrashesFolder", async (event) => {
            shell.showItemInFolder(path.join(app.getPath("temp"), app.getName() + " Crashes"));
            await sleep(1000);
        });
        ipcMain.on("getLangName", async (event) => {
            event.returnValue = await getLangName();
        });
        ipcMain.on("crash", async (event) => {
            process.crash();
        });
        ipcMain.handle("getSetting", (event, toGet: string) => {
            return getConfig(toGet);
        });
        ipcMain.on("copyDebugInfo", (event) => {
            let settingsFileContent = fs.readFileSync(getConfigLocation(), "utf-8");
            clipboard.writeText(
                "**OS:** " +
                    os.platform() +
                    " " +
                    os.version() +
                    "\n**Architecture:** " +
                    os.arch() +
                    "\n**ArmCord version:** " +
                    getVersion() +
                    "\n**Electron version:** " +
                    process.versions.electron +
                    "\n`" +
                    settingsFileContent +
                    "`"
            );
        });
        settingsWindow.webContents.setWindowOpenHandler(({url}) => {
            shell.openExternal(url);
            return {action: "deny"};
        });
        settingsLoadPage();
        settingsWindow.on("close", (event: Event) => {
            ipcMain.removeHandler("getSetting");
            ipcMain.removeAllListeners("saveSettings");
            instance = 0;
        });
    }
}
