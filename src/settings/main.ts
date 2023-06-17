import {BrowserWindow, app, clipboard, ipcMain, shell} from "electron";
import {
    Settings,
    getConfig,
    getConfigLocation,
    getDisplayVersion,
    getLangName,
    getVersion,
    setConfigBulk,
    sleep
} from "../utils";
import path from "path";
import os from "os";
import fs from "fs";
let settingsWindow: BrowserWindow;
let instance = 0;
//checkForDataFolder();
const userDataPath = app.getPath("userData");
const storagePath = path.join(userDataPath, "/storage/");
const themesPath = path.join(userDataPath, "/themes/");
const pluginsPath = path.join(userDataPath, "/plugins/");
export function createSettingsWindow(): void {
    console.log("Creating a settings window.");
    instance += 1;
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
            backgroundColor: "#2f3136",
            autoHideMenuBar: true,
            webPreferences: {
                sandbox: false,
                preload: path.join(__dirname, "preload.js")
            }
        });
        async function settingsLoadPage(): Promise<void> {
            settingsWindow.loadURL(`file://${__dirname}/settings.html`);
        }
        const userDataPath = app.getPath("userData");
        const themesFolder = `${userDataPath}/themes/`;
        if (!fs.existsSync(themesFolder)) {
            fs.mkdirSync(themesFolder);
            console.log("Created missing theme folder");
        }
        if (!fs.existsSync(`${userDataPath}/disabled.txt`)) {
            fs.writeFileSync(path.join(userDataPath, "/disabled.txt"), "");
        }
        settingsWindow.webContents.on("did-finish-load", () => {
            if (!settingsWindow.webContents.isLoading()) {
                fs.readdirSync(themesFolder).forEach((file) => {
                    try {
                        const manifest = fs.readFileSync(`${themesFolder}/${file}/manifest.json`, "utf8");
                        let themeFile = JSON.parse(manifest);
                        settingsWindow.webContents.send(
                            "themeLoader",
                            fs.readFileSync(`${themesFolder}/${file}/${themeFile.theme}`, "utf-8")
                        );
                        console.log(`%cLoaded ${themeFile.name} made by ${themeFile.author}`, "color:red");
                    } catch (err) {
                        console.error(err);
                    }
                });
            }
        });
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
        ipcMain.on("crash", async () => {
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
        settingsWindow.webContents.setWindowOpenHandler(({url}) => {
            shell.openExternal(url);
            return {action: "deny"};
        });
        settingsLoadPage();
        settingsWindow.on("close", () => {
            ipcMain.removeHandler("getSetting");
            ipcMain.removeAllListeners("saveSettings");
            instance = 0;
        });
    }
}
