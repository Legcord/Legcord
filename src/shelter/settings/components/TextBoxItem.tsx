import classes from "./DropdownItem.module.css";
const {
    ui: { Divider, Header, HeaderTags, TextBox },
} = shelter;

export const TextBoxItem = (props: {
    title: string;
    note: string;
    value: string;
    onInput: (v: string) => void;
}) => {
    return (
        <div class={classes.item}>
            <Header class={classes.title} tag={HeaderTags.H3}>
                {props.title}
            </Header>
            <div class={classes.note}>{props.note}</div>
            <br />
            <TextBox value={props.value} onInput={props.onInput} />
            <Divider mt />
        </div>
    );
};
