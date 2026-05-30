import { BrowserWindow, Menu, type MenuItemConstructorOptions, app } from "electron";
import type { Keybind, KeybindActions } from "../@types/keybind.js";
import { getConfig } from "../common/config.js";
import { setForceQuit } from "../common/forceQuit.js";
import { openSettings, runAction } from "../common/keybindActions.js";
import { getLang } from "../common/lang.js";
import { mainWindows } from "./window.js";

const keybindActionLabels: Record<KeybindActions, string> = {
    mute: "keybind-mute",
    deafen: "keybind-deafen",
    pushToTalk: "keybind-pushToTalk",
    leaveCall: "keybind-leaveCall",
    navigateForward: "keybind-navigateForward",
    navigateBack: "keybind-navigateBack",
    runJavascript: "keybind-runJavascript",
    openQuickCss: "keybind-openQuickCss",
    openSettings: "keybind-openSettings",
};

export function setMenu(): void {
    const keybinds = getConfig("keybinds");
    const keybindSubMenu: { label: string; accelerator: string; click: () => void }[] = [];
    keybinds.forEach((keybind: Keybind) => {
        if (!keybind.global && keybind.enabled) {
            keybindSubMenu.push({
                label: getLang(keybindActionLabels[keybind.action]),
                accelerator: keybind.accelerator,
                click: () => {
                    runAction(keybind);
                },
            });
        }
    });

    const template: MenuItemConstructorOptions[] = [
        {
            label: getLang("menu-legcord"),
            submenu: [
                { label: getLang("menu-about"), role: "about" },
                { type: "separator" },
                { role: "services" },
                { type: "separator" },
                {
                    label: getLang("menu-developerTools"),
                    accelerator: process.platform === "darwin" ? "Cmd+Option+I" : "Ctrl+Shift+I",
                    click() {
                        BrowserWindow.getFocusedWindow()!.webContents.toggleDevTools();
                    },
                },
                {
                    label: getLang("menu-openSettings"),
                    accelerator: "Cmd+,",
                    click() {
                        mainWindows.forEach((mainWindow) => {
                            mainWindow.show();
                            openSettings();
                        });
                    },
                },
                {
                    label: getLang("menu-reload"),
                    accelerator: "CmdOrCtrl+R",
                    click() {
                        mainWindows.forEach((mainWindow) => {
                            mainWindow.webContents.reloadIgnoringCache();
                        });
                    },
                },
                {
                    label: getLang("menu-restart"),
                    accelerator: "CmdOrCtrl+Shift+R",
                    click() {
                        app.relaunch();
                        app.exit();
                    },
                },
                { type: "separator" },
                { role: "hide" },
                { role: "hideOthers" },
                { role: "unhide" },
                { type: "separator" },
                {
                    label: getLang("menu-quit"),
                    accelerator: "CmdOrCtrl+Q",
                    click() {
                        setForceQuit(true);
                        app.quit();
                    },
                },
            ],
        },
        {
            label: getLang("menu-edit"),
            submenu: [
                {
                    label: getLang("menu-undo"),
                    accelerator: "CmdOrCtrl+Z",
                    click() {
                        BrowserWindow.getFocusedWindow()!.webContents.undo();
                    },
                },
                {
                    label: getLang("menu-redo"),
                    accelerator: "Shift+CmdOrCtrl+Z",
                    click() {
                        BrowserWindow.getFocusedWindow()!.webContents.redo();
                    },
                },
                { type: "separator" },
                { label: getLang("menu-cut"), accelerator: "CmdOrCtrl+X", role: "cut" },
                { label: getLang("menu-copy"), accelerator: "CmdOrCtrl+C", role: "copy" },
                { label: getLang("menu-paste"), accelerator: "CmdOrCtrl+V", role: "paste" },
                { label: getLang("menu-selectAll"), accelerator: "CmdOrCtrl+A", role: "selectAll" },
            ],
        },
        {
            label: getLang("menu-view"),
            submenu: [
                {
                    label: getLang("menu-toggleFullscreen"),
                    role: "togglefullscreen",
                },
                { label: getLang("menu-zoomIn"), accelerator: "CmdOrCtrl+Plus", role: "zoomIn" },
                // Fix for zoom in on keyboards with dedicated + like QWERTZ (or numpad)
                // See https://github.com/electron/electron/issues/14742 and https://github.com/electron/electron/issues/5256
                { label: getLang("menu-zoomIn"), accelerator: "CmdOrCtrl+=", role: "zoomIn", visible: false },
                { label: getLang("menu-zoomOut"), accelerator: "CmdOrCtrl+-", role: "zoomOut" },
                { type: "separator" },
                { label: getLang("menu-resetZoom"), accelerator: "CmdOrCtrl+0", role: "resetZoom" },
            ],
        },
        {
            label: getLang("menu-window"),
            submenu: [
                { label: getLang("menu-minimize"), accelerator: "Cmd+M", role: "minimize" },
                { label: getLang("menu-close"), accelerator: "Cmd+W", role: "close" },
            ],
        },
        {
            label: getLang("menu-keybind"),
            submenu: keybindSubMenu,
        },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
