import { createSignal, For, onMount, Show } from "solid-js";
import type { LegcordPluginInfo } from "../../../@types/legcordWindow.js";
import { EmptyState } from "../components/EmptyState.jsx";
import { PluginCard } from "../components/PluginCard.jsx";
import { SettingsPageHeader } from "../components/SettingsPageHeader.jsx";
import classes from "./PluginsPage.module.css";

const {
    ui: { Button, ButtonSizes, showToast },
    plugin: { store },
} = shelter;

function formatPluginMessage(template: string, name: string) {
    return template.replaceAll("{name}", name);
}

export function PluginsPage() {
    const [plugins, setPlugins] = createSignal<LegcordPluginInfo[]>([]);
    const [busyIds, setBusyIds] = createSignal<string[]>([]);
    const t = () => store.i18n;

    const setBusy = (pluginId: string, state: boolean) => {
        setBusyIds((current) => {
            if (state) {
                return current.includes(pluginId) ? current : [...current, pluginId];
            }
            return current.filter((id) => id !== pluginId);
        });
    };

    const isBusy = (pluginId: string) => busyIds().includes(pluginId);

    const refreshPlugins = async () => {
        const list = await window.legcord.plugins.list();
        setPlugins(list);
    };

    const onToggle = async (plugin: LegcordPluginInfo, enabled: boolean) => {
        setBusy(plugin.id, true);
        try {
            if (enabled && !plugin.compatible) {
                showToast({
                    title: t()["plugins-toastTitle"],
                    content:
                        plugin.compatibilityMessage ??
                        formatPluginMessage(t()["plugins-toastIncompatible"], plugin.name),
                    duration: 3500,
                });
                return;
            }
            const result = await window.legcord.plugins.setEnabled(plugin.id, enabled);
            if (!result.ok) {
                showToast({
                    title: t()["plugins-toastTitle"],
                    content: formatPluginMessage(
                        enabled ? t()["plugins-toastEnableFailed"] : t()["plugins-toastDisableFailed"],
                        plugin.name,
                    ),
                    duration: 3000,
                });
            }
            await refreshPlugins();
        } finally {
            setBusy(plugin.id, false);
        }
    };

    const onReload = async (plugin: LegcordPluginInfo) => {
        setBusy(plugin.id, true);
        try {
            const result = await window.legcord.plugins.reload(plugin.id);
            showToast({
                title: t()["plugins-toastTitle"],
                content: formatPluginMessage(
                    result.ok ? t()["plugins-toastReloaded"] : t()["plugins-toastReloadFailed"],
                    plugin.name,
                ),
                duration: 2500,
            });
            await refreshPlugins();
        } finally {
            setBusy(plugin.id, false);
        }
    };

    onMount(() => {
        void refreshPlugins();
    });

    return (
        <>
            <SettingsPageHeader title={t()["plugins-pageTitle"]} description={t()["plugins-pageDesc"]} />
            <div class={classes.toolbar}>
                <Button size={ButtonSizes.LARGE} onClick={() => void refreshPlugins()}>
                    {t()["plugins-refresh"]}
                </Button>
                <Button size={ButtonSizes.LARGE} onClick={window.legcord.plugins.openFolder}>
                    {t()["plugins-openFolder"]}
                </Button>
            </div>
            <Show
                when={plugins().length > 0}
                fallback={
                    <EmptyState
                        message={t()["plugins-empty"]}
                        description={t()["plugins-emptyDesc"]}
                        actionLabel={t()["plugins-openFolder"]}
                        onAction={window.legcord.plugins.openFolder}
                    />
                }
            >
                <For each={plugins()}>
                    {(plugin) => (
                        <PluginCard
                            plugin={plugin}
                            busy={isBusy(plugin.id)}
                            onToggle={(enabled) => void onToggle(plugin, enabled)}
                            onReload={() => void onReload(plugin)}
                        />
                    )}
                </For>
            </Show>
        </>
    );
}
