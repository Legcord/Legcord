import {Dropdown} from "./Dropdown";
import classes from "./DropdownItem.css";
const {
    plugin: {store},
    ui: {Divider, Header, LinkButton, HeaderTags}
} = shelter;

export const DropdownItem = (props) => {
    return (
        <div class={classes.item}>
            <Header class={classes.title} tag={HeaderTags.H3}>
                {props.title}
            </Header>
            <div class={classes.note}>{props.note}</div>
            <Show when={props.link} keyed>
                <LinkButton href={props.link}>Learn more here.</LinkButton>
            </Show>
            <Dropdown value={props.value} onChange={props.onChange}>
                {props.children}
            </Dropdown>
            <Divider />
        </div>
    );
};
