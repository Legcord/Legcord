import { type JSXElement, Show } from "solid-js";
import { Dropdown } from "./Dropdown.jsx";
import classes from "./DropdownItem.module.css";
const {
    ui: { Divider, Header, LinkButton, HeaderTags },
} = shelter;

export const DropdownItem = (props: {
    title: string;
    note: string;
    link?: string;
    value: string;
    onChange: (val: string) => void;
    options: { label: string; value: string | number }[];
    limitHeight?: boolean | undefined;
    extraItems?: JSXElement;
}) => {
    return (
        <div class={classes.item}>
            <Header class={classes.title} tag={HeaderTags.H3}>
                {props.title}
            </Header>
            <div class={classes.note}>
                {props.note}
                <Show when={props.link} keyed>
                    <LinkButton href={props.link!}> Learn more here.</LinkButton>
                </Show>
            </div>
            <Dropdown value={props.value} onChange={props.onChange} options={props.options} limitHeight={props.limitHeight} />
            <Show when={props.extraItems} keyed>
                {props.extraItems}
            </Show>
            <Divider />
        </div>
    );
};
