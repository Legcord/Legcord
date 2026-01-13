import { For } from "solid-js";
import classes from "./SegmentedControl.module.css";

export const SegmentedControl = (props: {
    value: string | number;
    onChange: (val: string) => void;
    options: { label: string; value: string | number }[];
}) => {
    return (
        <div class={classes.container}>
            <For each={props.options}>
                {(opt) => {
                    const isSelected = () => String(opt.value) === String(props.value);

                    return (
                        // biome-ignore lint/a11y/useFocusableInteractive: FIX-ME
                        <div
                            class={classes.item}
                            role="tab"
                            aria-selected={isSelected() ? "true" : "false"}
                            onClick={() => props.onChange(String(opt.value))}
                        >
                            {opt.label}
                        </div>
                    );
                }}
            </For>
        </div>
    );
};
