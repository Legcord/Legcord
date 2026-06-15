import type { Settings, ValidMods } from "../../@types/settings.js";

const {
    plugin: { store },
} = shelter;

export let isRestartRequired = false;

export function setRestartRequired() {
    isRestartRequired = true;
}

export function refreshSettings() {
    store.settings = window.legcord.settings.getConfig();
}

export function refreshThemes() {
    store.themes = window.legcord.themes.getThemes();
}

export function setConfig<K extends keyof Settings>(key: K, value: Settings[K], shouldRestart?: boolean) {
    store.settings[key] = value;
    console.log(key, ":", store.settings[key]);
    if (shouldRestart) {
        isRestartRequired = true;
    }
    window.legcord.settings.setConfig(key, value);
    refreshSettings();
}

function removeMod(array: ValidMods[], filter: ValidMods) {
    return array.filter((i) => i !== filter);
}

export function toggleMod(mod: ValidMods, enabled: boolean) {
    isRestartRequired = true;
    const currentMods = store.settings.mods;
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

export function isMinWindowsVersion(major: number, minor: number, build: number) {
    const [sys_major, sys_minor, sys_build] = window.legcord.osRelease
        .split(".")
        .map((val, _, __) => Number.parseInt(val, 10));
    return sys_major >= major && sys_minor >= minor && sys_build >= build;
}
