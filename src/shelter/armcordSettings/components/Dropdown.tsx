import type { JSX, JSXElement } from "solid-js";
import classes from "./Dropdown.module.css";

export const Dropdown = (props: {
    value: string | number | string[];
    onChange: JSX.EventHandler<HTMLSelectElement, Event>;
    children: JSXElement[];
}) => {
    return (
        <select value={props.value} onChange={props.onChange} class={classes.acDropdown}>
            {props.children}
        </select>
    );
};
