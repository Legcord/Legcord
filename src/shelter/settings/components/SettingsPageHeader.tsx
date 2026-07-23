import type { JSX } from "solid-js";
import { Show } from "solid-js";
import classes from "./SettingsPageHeader.module.css";

const {
    ui: { Header, HeaderTags, Text, TextTags, Divider },
} = shelter;

export function SettingsPageHeader(props: {
    title: string;
    description: string;
    children?: JSX.Element;
    /** Render a Divider under the header block (default true). */
    divider?: boolean;
}) {
    return (
        <div class={classes.header}>
            <Header tag={HeaderTags.HeadingXXL}>{props.title}</Header>
            <Text tag={TextTags.textSM} class={classes.description}>
                {props.description}
            </Text>
            <Show when={props.children}>{props.children}</Show>
            <Show when={props.divider !== false}>
                <Divider mt mb />
            </Show>
        </div>
    );
}
