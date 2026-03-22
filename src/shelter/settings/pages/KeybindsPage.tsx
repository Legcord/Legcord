const {
    plugin: { store },
    ui: { Button, Header, HeaderTags, ButtonSizes, Divider, openModal },
} = shelter;
import { For } from "solid-js";
import type { Keybind } from "../../../@types/keybind.js";
import { KeybindCard } from "../components/KeybindCard.jsx";
import { KeybindMaker } from "../components/KeybindMaker.jsx";
export function KeybindsPage() {
    function addNewKeybind() {
        openModal(({ close }: { close: () => void }) => <KeybindMaker close={close} />);
    }
    return (
        <>
            <Header tag={HeaderTags.H1}>Keybinds</Header>
            <Divider mt mb />
            <div style={{ display: "flex", "justify-content": "flex-end", "margin-bottom": "12px" }}>
                <Button size={ButtonSizes.LARGE} onClick={addNewKeybind}>
                    Create a keybind
                </Button>
            </div>
            <For each={store.settings.keybinds}>{(keybind: Keybind) => <KeybindCard keybind={keybind} />}</For>
        </>
    );
}
