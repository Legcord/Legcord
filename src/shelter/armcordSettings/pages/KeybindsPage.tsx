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
        const close = openModal(() => <KeybindMaker />);
        console.log(close); // FIXME
    }
    return (
        <>
            <Header tag={HeaderTags.H1}>Keybinds</Header>
            <Divider mt mb />
            <Button size={ButtonSizes.MAX} onClick={addNewKeybind}>
                Create a keybind
            </Button>
            <For each={store.settings.keybinds}>{(keybind: Keybind) => <KeybindCard keybind={keybind} />}</For>
        </>
    );
}
