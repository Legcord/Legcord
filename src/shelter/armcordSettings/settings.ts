import type { Settings, ValidMods } from "../../@types/settings.js";

const {
    plugin: { store },
} = shelter;
export let isRestartRequired = false;
export function refreshSettings() {
    store.settings = window.armcord.settings.config;
    console.log(store.settings);
}
export function set<K extends keyof Settings>(key: ValidMods | K, value: Settings[K]) {
    isRestartRequired = true;
    if (key === "vencord" && value === true) {
        store.vencord = true;
        store.equicord = false;
        window.armcord.settings.setConfig("mods", ["vencord"]);
    } else if (key === "vencord" && value === false) {
        store.vencord = false;
        window.armcord.settings.setConfig("mods", []);
    } else if (key === "equicord" && value === true) {
        store.equicord = true;
        store.vencord = false;
        window.armcord.settings.setConfig("mods", ["equicord"]);
    } else if (key === "equicord" && value === false) {
        store.equicord = false;
        window.armcord.settings.setConfig("mods", []);
    } else {
        store.settings[key] = value;
        console.log(`${key}: ${store.settings[key]}`);

        window.armcord.settings.setConfig(key as K, value);
    }
}
