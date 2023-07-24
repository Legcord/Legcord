import {BrowserWindow, app, globalShortcut, ipcMain, shell} from "electron";
import path from "path";
import {getConfig, registerGlobalKeybinds, setConfig} from "../utils";
let keybindWindow: BrowserWindow;
let instance = 0;

export function createKeybindWindow(): void {
    console.log("Creating keybind maker window.");
    instance += 1;
    if (instance > 1) {
        if (keybindWindow) {
            keybindWindow.show();
            keybindWindow.restore();
        }
    } else {
        keybindWindow = new BrowserWindow({
            width: 720,
            height: 670,
            title: `ArmCord Global Keybinds Maker`,
            darkTheme: true,
            frame: true,
            backgroundColor: "#2f3136",
            autoHideMenuBar: true,
            webPreferences: {
                sandbox: false,
                preload: path.join(__dirname, "preload.js")
            }
        });
        async function makerLoadPage(): Promise<void> {
            globalShortcut.unregisterAll();
            keybindWindow.loadURL(`file://${__dirname}/maker.html`);
        }
        keybindWindow.webContents.setWindowOpenHandler(({url}) => {
            shell.openExternal(url);
            return {action: "deny"};
        });
        ipcMain.on("addKeybind", async (_event, keybind) => {
            var keybinds = await getConfig("keybinds");
            keybind.replace(" ", "Space");
            if (keybinds.includes(keybind)) return;
            keybinds.push(keybind);
            await setConfig("keybinds", keybinds);
            keybindWindow.webContents.reload();
        });
        ipcMain.on("removeKeybind", async (_event, keybind) => {
            var keybinds = await getConfig("keybinds");
            const index = keybinds.indexOf(keybind);
            keybinds.splice(index, 1);
            await setConfig("keybinds", keybinds);
            keybindWindow.webContents.reload();
        });
        keybindWindow.webContents.on("did-finish-load", async () => {
            for (const keybind of await getConfig("keybinds")) {
                console.log(keybind);
                keybindWindow.webContents.send("keybindCombo", keybind);
            }
        });
        keybindWindow.on("close", () => {
            registerGlobalKeybinds();
        });
        makerLoadPage();
        keybindWindow.on("close", () => {
            instance = 0;
        });
    }
}
