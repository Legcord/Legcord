export const VALID_PLUGIN_ID = /^(?=.{1,64}$)[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*$/;

export function isValidPluginId(pluginId: string) {
    return VALID_PLUGIN_ID.test(pluginId);
}
