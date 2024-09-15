const {
    plugin: {store}
} = shelter;
export let isRestartRequired = false;
export function refreshSettings() {
    store.settings = window.armcord.settings.config;
    console.log(store.settings);
}
export function set(key, value) {
    isRestartRequired = true;
    if (key == "vencord" && value == true) {
        store.vencord = true;
        store.equicord = false;
        armcord.settings.setConfig("mods", "vencord");
        armcord.settings.setConfig("equicord", false);
    } else if (key == "vencord" && value == false) {
        store.vencord = false;
        armcord.settings.setConfig("mods", "none");
    } else if (key == "equicord" && value == true) {
        store.equicord = true;
        store.vencord = false;
        armcord.settings.setConfig("mods", "equicord");
        armcord.settings.setConfig("vencord", false);
    } else if (key == "equicord" && value == false) {
        store.equicord = false;
        armcord.settings.setConfig("mods", "none");
    } else {
        store.settings[key] = value;
        console.log(key + ": " + store.settings[key]);
        armcord.settings.setConfig(key, value);
    }
}
