import { app, globalShortcut } from "electron";
import type { Keybind } from "../@types/keybind.js";
import { getConfig } from "../common/config.js";
import { runAction } from "../common/keybindActions.js";

void app.whenReady().then(() => {
    const keybinds = getConfig("keybinds");
    keybinds.forEach((keybind: Keybind) => {
        if (keybind.enabled && keybind.global) {
            globalShortcut.register(keybind.accelerator, () => {
                runAction(keybind.action);
            });
        }
    });
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});
