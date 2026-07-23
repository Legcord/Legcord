import { createSignal, For, Show } from "solid-js";
import type { Settings } from "../../../@types/settings.js";
import type { ThemeManifest } from "../../../@types/themeManifest.js";
import { EmptyState } from "../components/EmptyState.jsx";
import { SettingsPageHeader } from "../components/SettingsPageHeader.jsx";
import { ThemesCard } from "../components/ThemesCard.jsx";
import { refreshThemes, setConfig } from "../settings.js";
import classes from "./ThemesPages.module.css";

const {
    ui: { Button, Header, HeaderTags, ButtonSizes, TextBox, showToast, SwitchItem, Text, TextTags },
    plugin: { store },
} = shelter;

const BETTERDISCORD_THEMES_URL = "https://betterdiscord.app/themes";

export function ThemesPage() {
    const [downloadUrl, setDownloadUrl] = createSignal("");
    refreshThemes();

    function installTheme() {
        window.legcord.themes.install(downloadUrl());
        setDownloadUrl("");
        setTimeout(() => {
            refreshThemes();
        }, 1000);
        showToast({
            title: store.i18n["themes-success"],
            content: store.i18n["themes-bdInstalled"],
            duration: 3000,
        });
    }

    const settings = () => store.settings as Settings;
    const t = store.i18n;
    const themes = () => (store.themes as ThemeManifest[]) ?? [];

    return (
        <>
            <SettingsPageHeader title={t["themes-pageTitle"]} description={t["themes-pageDesc"]} divider={true} />
            <SwitchItem
                note={store.i18n["settings-quickCss-desc"]}
                value={settings().quickCss}
                onChange={(e: boolean) => {
                    console.log("Toggled quick CSS", e);
                    if (e) {
                        window.legcord.themes.enableQuickCss();
                    } else {
                        window.legcord.themes.disableQuickCss();
                    }
                    setConfig("quickCss", e);
                }}
            >
                {store.i18n["settings-quickCss"]}
            </SwitchItem>
            <div class={classes.toolbar}>
                <Button
                    size={ButtonSizes.LARGE}
                    onClick={window.legcord.themes.openQuickCss}
                    disabled={!settings().quickCss}
                >
                    {t["themes-openQuickCss"]}
                </Button>
                <Button size={ButtonSizes.LARGE} onClick={window.legcord.themes.openImportPicker}>
                    {t["themes-importFromFile"]}
                </Button>
                <Button size={ButtonSizes.LARGE} onClick={window.legcord.settings.openThemesFolder}>
                    {t["themes-openThemesFolder"]}
                </Button>
                <Button
                    size={ButtonSizes.LARGE}
                    onClick={() => {
                        store.themes = window.legcord.themes.refresh();
                    }}
                >
                    {t["themes-refresh"]}
                </Button>
            </div>
            <div class={classes.addBox}>
                <TextBox
                    value={downloadUrl()}
                    onInput={setDownloadUrl}
                    placeholder={t["themes-importUrlPlaceholder"]}
                />
                <Button size={ButtonSizes.MEDIUM} onClick={installTheme}>
                    {t["themes-import"]}
                </Button>
            </div>
            <Text tag={TextTags.textSM} class={classes.importNote}>
                {t["themes-importUrlNote"]}
            </Text>
            <hr class={classes.divider} />
            <Header tag={HeaderTags.HeadingLG}>{t["themes-installed"]}</Header>
            <Show
                when={themes().length > 0}
                fallback={
                    <EmptyState
                        message={t["themes-empty"]}
                        description={t["themes-emptyDesc"]}
                        linkHref={BETTERDISCORD_THEMES_URL}
                        linkLabel={t["themes-browseThemes"]}
                    />
                }
            >
                <For each={themes()}>{(theme: ThemeManifest) => <ThemesCard theme={theme} />}</For>
            </Show>
        </>
    );
}
