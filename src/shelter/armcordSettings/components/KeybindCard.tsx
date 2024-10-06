import { createSignal } from "solid-js";
import type { Keybind } from "../../../@types/keybind.js";
import { refreshSettings } from "../settings.js";
import classes from "./KeybindCard.module.css";

const {
    ui: { IconBin, Header, Switch, HeaderTags },
    plugin: { store },
} = shelter;

export const KeybindCard = (props: { keybind: Keybind }) => {
    const [switchState, setSwitchState] = createSignal(props.keybind.enabled);

    function toggleKeybind(state: boolean) {
        setSwitchState(state);
        console.log(`${props.keybind.accelerator}: ${state}`);
        window.armcord.settings.editKeybind(props.keybind.id, props.keybind);
        refreshSettings();
        console.log(store.settings.keybinds);
    }
    function removeKeybind() {
        window.armcord.settings.removeKeybind(props.keybind.id);
        refreshSettings();
        console.log(store.settings.keybinds);
    }
    return (
        <div class={classes.card}>
            <div class={classes.info}>
                <Header tag={HeaderTags.H2}>{props.keybind.action}</Header>
                <Header class={classes.eyebrow} tag={HeaderTags.EYEBROW}>
                    {props.keybind.accelerator}
                </Header>
            </div>
            <div class={classes.btnContainer}>
                <button title="Delete" type="button" onClick={removeKeybind} class={classes.btn}>
                    <IconBin />
                </button>
            </div>
            <div class={classes.switch}>
                <Switch checked={switchState()} onChange={toggleKeybind} />
            </div>
        </div>
    );
};
