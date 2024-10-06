import type { Settings, ValidMods } from "../../@types/settings.js";

const {
    plugin: { store },
} = shelter;

const settings = store.settings as Settings;

export let isRestartRequired = false;
export function refreshSettings() {
    store.settings = window.armcord.settings.getConfig();
}

export function setConfig<K extends keyof Settings>(key: K, value: Settings[K]) {
    settings[key] = value;
    console.log(`${key}: ${store.settings[key]}`);

    window.armcord.settings.setConfig(key, value);
    refreshSettings();
}

function removeMod(array: ValidMods[], filter: ValidMods) {
    return array.filter((i) => i !== filter);
}

export function toggleMod(mod: ValidMods, enabled: boolean) {
    isRestartRequired = true;
    const currentMods = settings.mods;
    if (enabled) {
        if (mod === "vencord") {
            currentMods.push("vencord");
            setConfig("mods", removeMod(currentMods, "equicord"));
        } else if (mod === "equicord") {
            currentMods.push("equicord");
            setConfig("mods", removeMod(currentMods, "vencord"));
        }
    } else {
        setConfig("mods", removeMod(currentMods, mod));
    }
}
