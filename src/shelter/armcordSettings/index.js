import {SettingsPage} from "./pages/SettingsPage";
import {ThemesPage} from "./pages/ThemesPage";
import {KeybindsPage} from "./pages/KeybindsPage";
import {isRestartRequired, refreshSettings} from "./settings";
const {
    plugin: {store},
    settings: {registerSection},
    util: {log},
    ui: {openConfirmationModal},
    flux: {dispatcher}
} = shelter;

let settingsPages = [
    registerSection("divider"),
    registerSection("header", "ArmCord"),
    registerSection("section", "armcord-settings", "Settings", SettingsPage),
    registerSection("section", "armcord-themes", "Themes", ThemesPage),
    registerSection("section", "armcord-keybinds", "Keybinds", KeybindsPage)
];

function restartRequired(payload) {
    if (payload.event === "settings_pane_viewed" && typeof payload.properties.origin_pane != "undefined") {
        if (payload.properties.origin_pane == "armcord-settings") {
            if (isRestartRequired) {
                openConfirmationModal({
                    header: () => "Restart required",
                    body: () => "You need to restart to apply these changes.",
                    type: "danger",
                    confirmText: "Restart",
                    cancelText: "I'll do it later"
                }).then(
                    () => armcord.restart(),
                    () => console.log("restart skipped")
                );
            }
        }
    }
}

export function onLoad() {
    refreshSettings();
    // used for restart required dialog later
    store.i18n = window.armcord.translations;
    // make this better
    if (window.armcord.settings.config.mods == "vencord") {
        store.vencord = true;
    } else {
        store.vencord = false;
    }
    if (window.armcord.settings.config.mods == "equicord") {
        store.equicord = true;
    } else {
        store.equicord = false;
    }
    log("ArmCord Settings");
    settingsPages;
    dispatcher.subscribe("TRACK", restartRequired);
}
export function onUnload() {
    settingsPages.forEach((e) => e());
    dispatcher.unsubscribe("TRACK", restartRequired);
}
