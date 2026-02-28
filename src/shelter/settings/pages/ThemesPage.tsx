import { For, createSignal } from "solid-js";
import type { Settings } from "../../../@types/settings.js";
import type { ThemeManifest } from "../../../@types/themeManifest.js";
import { ThemesCard } from "../components/ThemesCard.jsx";
import { refreshThemes, setConfig } from "../settings.js";
import classes from "./ThemesPages.module.css";

const {
    ui: { Button, Header, HeaderTags, ButtonSizes, TextBox, showToast, SwitchItem },
    plugin: { store },
} = shelter;
const settings = store.settings as Settings;
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

    const t = store.i18n;
    return (
        <>
            <Header tag={HeaderTags.H1}>Themes</Header>
            <SwitchItem
                note={store.i18n["settings-quickCss-desc"]}
                value={settings.quickCss}
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
            <div class={classes.buttonBox}>
                <Button
                    size={ButtonSizes.LARGE}
                    onClick={window.legcord.themes.openQuickCss}
                    disabled={!settings.quickCss}
                >
                    {t["themes-openQuickCss"]}
                </Button>
                <Button size={ButtonSizes.LARGE} onClick={window.legcord.themes.openImportPicker}>
                    {t["themes-importFromFile"]}
                </Button>
                <Button size={ButtonSizes.LARGE} onClick={window.legcord.settings.openThemesFolder}>
                    {t["themes-openThemesFolder"]}
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
            <For each={store.themes}>{(theme: ThemeManifest) => <ThemesCard theme={theme} />}</For>
        </>
    );
}
