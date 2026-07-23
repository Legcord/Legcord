import { For, Show } from "solid-js";
import type { Keybind } from "../../../@types/keybind.js";
import { EmptyState } from "../components/EmptyState.jsx";
import { KeybindCard } from "../components/KeybindCard.jsx";
import { KeybindMaker } from "../components/KeybindMaker.jsx";
import { SettingsPageHeader } from "../components/SettingsPageHeader.jsx";
import classes from "./KeybindsPage.module.css";

const {
    plugin: { store },
    ui: { Button, ButtonSizes, openModal, Text, TextTags },
} = shelter;

export function KeybindsPage() {
    function addNewKeybind() {
        openModal(({ close }: { close: () => void }) => <KeybindMaker close={close} />);
    }

    const t = store.i18n;
    const keybinds = () => (store.settings.keybinds as Keybind[]) ?? [];

    return (
        <>
            <SettingsPageHeader title={t["keybinds-pageTitle"]} description={t["keybinds-pageDesc"]}>
                <Text tag={TextTags.textSM} class={classes.tip}>
                    {t["keybind-globalNote"]}
                </Text>
            </SettingsPageHeader>
            <div class={classes.toolbar}>
                <Button size={ButtonSizes.LARGE} onClick={addNewKeybind}>
                    {t["keybind-addKeybind"]}
                </Button>
            </div>
            <Show
                when={keybinds().length > 0}
                fallback={
                    <EmptyState
                        message={t["keybinds-empty"]}
                        description={t["keybinds-emptyDesc"]}
                        actionLabel={t["keybind-addKeybind"]}
                        onAction={addNewKeybind}
                    />
                }
            >
                <For each={keybinds()}>{(keybind: Keybind) => <KeybindCard keybind={keybind} />}</For>
            </Show>
        </>
    );
}
