import {BrowserWindow, Menu, app, clipboard, globalShortcut} from "electron";
import {mainWindow} from "./window";
import {getConfig} from "./utils";
import {createSettingsWindow} from "./settings/main";

function paste(contents: any): void {
    const contentTypes = clipboard.availableFormats().toString();
    //Workaround: fix pasting the images.
    if (contentTypes.includes("image/") && contentTypes.includes("text/html")) {
        clipboard.writeImage(clipboard.readImage());
    }
    contents.paste();
}
export async function setMenu(): Promise<void> {
    let template: Electron.MenuItemConstructorOptions[] = [
        {
            label: "ArmCord",
            submenu: [
                {label: "About ArmCord", role: "about"}, //orderFrontStandardAboutPanel
                {type: "separator"},
                {
                    label: "Developer tools",
                    accelerator: "CmdOrCtrl+Shift+I",
                    click() {
                        BrowserWindow.getFocusedWindow()!.webContents.toggleDevTools();
                    }
                },
                {
                    label: "Open settings",
                    accelerator: "CmdOrCtrl+Shift+'",
                    click() {
                        createSettingsWindow();
                    }
                },
                {
                    label: "Fullscreen",
                    role: "togglefullscreen"
                },
                {
                    label: "Reload",
                    accelerator: "CmdOrCtrl+R",
                    click() {
                        mainWindow.reload();
                    }
                },
                {
                    label: "Quit",
                    accelerator: "CmdOrCtrl+Q",
                    click() {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: "Edit",
            submenu: [
                {label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo"},
                {label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo"},
                {type: "separator"},
                {label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut"},
                {label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy"},
                {
                    label: "Paste",
                    accelerator: "CmdOrCtrl+V",
                    click() {
                        paste(mainWindow.webContents);
                    }
                },
                {label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectAll"}
            ]
        },
        {
            label: "Zoom",
            submenu: [
                {label: "Zoom in", accelerator: "CmdOrCtrl+Plus", role: "zoomIn"},
                // Fix for zoom in on keyboards with dedicated + like QWERTZ (or numpad)
                // See https://github.com/electron/electron/issues/14742 and https://github.com/electron/electron/issues/5256
                {label: "Zoom in", accelerator: "CmdOrCtrl+=", role: "zoomIn", visible: false},
                {label: "Zoom out", accelerator: "CmdOrCtrl+-", role: "zoomOut"},
                {type: "separator"},
                {label: "Reset zoom", accelerator: "CmdOrCtrl+0", role: "resetZoom"}
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
