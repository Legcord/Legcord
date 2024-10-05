import type { JSX, PropsWithChildren } from "solid-js";
import classes from "./Dropdown.module.css";

export const Dropdown = (props: {
    value: string | number | string[];
    onChange: JSX.EventHandler<HTMLSelectElement, Event>;
    // biome-ignore lint/suspicious/noExplicitAny: couldn't figure out how to do multiple children
    children: any;
}) => {
    return (
        <select value={props.value} onChange={props.onChange} class={classes.acDropdown}>
            {props.children}
        </select>
    );
};
