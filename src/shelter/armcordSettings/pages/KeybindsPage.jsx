const {
    plugin: {store},
    ui: {Button, Header, HeaderTags, ButtonSizes, Divider}
} = shelter;
import {KeybindCard} from "../components/KeybindCard";
export function KeybindsPage() {
    function addNewKeybind() {

    }
    return (
        <>
            <Header tag={HeaderTags.H1}>Keybinds</Header>
            <Divider mt mb />
            <Button size={ButtonSizes.MAX} onClick={window.armcord.openThemesWindow}>
                Create a keybind
            </Button>
            <For each={store.settings.keybinds}>
                {(keybind) => <KeybindCard keybind={keybind}></KeybindCard>}
            </For>
        </>
    );
}
