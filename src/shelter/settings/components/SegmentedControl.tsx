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
                {(opt) => (
                    <div
                        class={classes.item}
                        aria-selected={opt.value == props.value}
                        onClick={() => props.onChange(String(opt.value))}
                    >
                        {opt.label}
                    </div>
                )}
            </For>
        </div>
    );
};