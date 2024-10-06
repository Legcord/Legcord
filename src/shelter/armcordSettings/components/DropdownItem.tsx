import { type JSX, type JSXElement, Show } from "solid-js";
import { Dropdown } from "./Dropdown.js";
import classes from "./DropdownItem.module.css";
const {
    ui: { Divider, Header, LinkButton, HeaderTags },
} = shelter;

export const DropdownItem = (props: {
    title: string;
    note: string;
    link?: string;
    value: string;
    onChange: JSX.EventHandler<HTMLSelectElement, Event>;
    children: JSXElement[];
}) => {
    return (
        <div class={classes.item}>
            <Header class={classes.title} tag={HeaderTags.H3}>
                {props.title}
            </Header>
            <div class={classes.note}>{props.note}</div>
            <Show when={props.link} keyed>
                <LinkButton href={props.link!}>Learn more here.</LinkButton>
            </Show>
            {/* biome-ignore lint/correctness/noChildrenProp: FIX-ME, couldn't figure out proper types */}
            <Dropdown value={props.value} onChange={props.onChange} children={props.children} />
            <Divider />
        </div>
    );
};
