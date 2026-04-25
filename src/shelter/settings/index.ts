/// <reference path="../../../node_modules/@uwu/shelter-defs/dist/shelter-defs/rootdefs.d.ts" />
import {
    GamesSidebarIcon,
    KeybindsSidebarIcon,
    PluginsSidebarIcon,
    SettingsSidebarIcon,
    ThemesSidebarIcon,
} from "./components/icons/SettingsNavIcons.jsx";
import { KeybindsPage } from "./pages/KeybindsPage.jsx";
import { PluginsPage } from "./pages/PluginsPage.jsx";
import { RegisteredGamesPage } from "./pages/RegisteredGamesPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { ThemesPage } from "./pages/ThemesPage.jsx";

import { isRestartRequired, refreshSettings, refreshThemes } from "./settings.js";
const {
    plugin: { store },
    settings: { registerSection },
    util: { log },
    ui: { openConfirmationModal },
    flux: { dispatcher, storesFlat },
} = shelter;

const settingsPages = [
    registerSection("divider"),
    registerSection("header", "Legcord"),
    registerSection("section", "legcord-settings", "Settings", SettingsPage, { icon: SettingsSidebarIcon }),
    registerSection("section", "legcord-themes", "Themes", ThemesPage, { icon: ThemesSidebarIcon }),
    registerSection("section", "legcord-plugins", "Plugins", PluginsPage, { icon: PluginsSidebarIcon }),
    registerSection("section", "legcord-keybinds", "Keybinds", KeybindsPage, { icon: KeybindsSidebarIcon }),
    registerSection("section", "legcord-games", "Games", RegisteredGamesPage, { icon: GamesSidebarIcon }),
];

function restartRequired(payload: { event: string; properties: { origin_pane: string } }) {
    if (payload.event === "settings_pane_viewed" && typeof payload.properties.origin_pane !== "undefined") {
        const pane = payload.properties.origin_pane;
        if ((pane === "legcord-settings" || pane === "legcord-games") && isRestartRequired) {
            openConfirmationModal({
                header: () => store.i18n["settings-restartRequired"],
                body: () => store.i18n["settings-restartRequiredBody"],
                type: "danger",
                confirmText: store.i18n["settings-restart"],
                cancelText: store.i18n["settings-restartLater"],
            }).then(
                () => window.legcord.restart(),
                () => console.log("restart skipped"),
            );
        }
    }
}

export function onLoad() {
    refreshSettings();
    refreshThemes();
    // used for restart required dialog later
    store.i18n = window.legcord.translations;
    log("Legcord Settings");
    window.legcord.settings.setLang(storesFlat.LocaleStore.locale);
    settingsPages;
    dispatcher.subscribe("TRACK", restartRequired);
}
export function onUnload() {
    settingsPages.forEach((e) => e());
    dispatcher.unsubscribe("TRACK", restartRequired);
}
