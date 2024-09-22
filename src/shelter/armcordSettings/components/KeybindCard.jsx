import classes from "./KeybindCard.css";
import { createSignal } from "solid-js";

const {
  ui: { IconBin, Header, Switch, HeaderTags, focusring, tooltip },
} = shelter;
false && focusring;
false && tooltip;
export const KeybindCard = (props) => {
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
        <button use:tooltip="Delete" use:focusring class={classes.btn}>
          <IconBin />
        </button>
      </div>
      <div class={classes.switch}>
        <Switch checked={switchState} onChange={setSwitchState} />
      </div>
    </div>
  );
};
