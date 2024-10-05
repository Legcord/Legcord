import { createSignal } from "solid-js";
import type { Keybind } from "../../../@types/keybind.js";
import classes from "./KeybindCard.module.css";

const {
    ui: { IconBin, Header, Switch, HeaderTags, focusring, tooltip },
} = shelter;
false && focusring;
false && tooltip;
export const KeybindCard = (props: { keybind: Keybind }) => {
    const [switchState, setSwitchState] = createSignal(false);
    return (
        <div class={classes.card}>
            <div class={classes.info}>
                <Header tag={HeaderTags.H2}>{props.keybind.action}</Header>
                <Header class={classes.eyebrow} tag={HeaderTags.EYEBROW}>
                    {props.keybind.accelerator}
                </Header>
            </div>
            <div class={classes.btnContainer}>
                <button title="Delete" type="button" class={classes.btn}>
                    <IconBin />
                </button>
            </div>
            <div class={classes.switch}>
                <Switch checked={switchState} onChange={setSwitchState} />
            </div>
        </div>
    );
};
