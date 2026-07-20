import { app, globalShortcut } from "electron";
import type { Keybind } from "../@types/keybind.js";
import { getConfig } from "../common/config.js";
import { KGlobalAccelRegisterShortcuts } from "../common/dbus.js";
import { runAction } from "../common/keybindActions.js";
import { getDesktopEnvironment } from "../main.js";
import { setMenu } from "./menu.js";

export function registerGlobalKeybinds() {
    const keybinds = getConfig("keybinds");
    keybinds.forEach((keybind: Keybind) => {
        if (keybind.enabled && keybind.global) {
            try {
                globalShortcut.register(keybind.accelerator, () => {
                    runAction(keybind);
                });
            } catch {}
        }
    });

    if (getDesktopEnvironment() === 'kde') {
        console.info("KDE Enviroment, registering available global shortcuts.")
        KGlobalAccelRegisterShortcuts();
    }
}
app.on("will-quit", () => {
    try {
        globalShortcut.unregisterAll();
    } catch (_e) {}
});

export function refreshGlobalKeybinds() {
    console.log("[Keybind Manager] Refreshing keybinds");
    globalShortcut.unregisterAll();
    registerGlobalKeybinds();
    setMenu();
}
