import {BrowserWindow, app, shell} from "electron";
import path from "path";
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
            width: 660,
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
            keybindWindow.loadURL(`file://${__dirname}/maker.html`);
        }
        keybindWindow.webContents.setWindowOpenHandler(({url}) => {
            shell.openExternal(url);
            return {action: "deny"};
        });
        makerLoadPage();
    }
}
