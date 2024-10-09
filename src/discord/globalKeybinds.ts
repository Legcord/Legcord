import { app, globalShortcut } from "electron";
import type { Keybind } from "../@types/keybind.js";
import { getConfig } from "../common/config.js";
import { runAction } from "../common/keybindActions.js";

export function registerGlobalKeybinds() {
    const keybinds = getConfig("keybinds");
    keybinds.forEach((keybind: Keybind) => {
        if (keybind.enabled && keybind.global) {
            globalShortcut.register(keybind.accelerator, () => {
                runAction(keybind.action);
            });
        }
    });
}
app.on("will-quit", () => {
    try {
        globalShortcut.unregisterAll();
    } catch (e) {}
});

export function refreshGlobalKeybinds() {
    console.log("[Keybind Manager] Refreshing keybinds");
    globalShortcut.unregisterAll();
    registerGlobalKeybinds();
}
