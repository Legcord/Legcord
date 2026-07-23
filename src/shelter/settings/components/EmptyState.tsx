import { Show } from "solid-js";
import classes from "./EmptyState.module.css";

const {
    ui: { Header, HeaderTags, Text, TextTags, Button, ButtonSizes, LinkButton },
} = shelter;

export function EmptyState(props: {
    message: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    linkHref?: string;
    linkLabel?: string;
}) {
    return (
        <div class={classes.empty}>
            <Header tag={HeaderTags.HeadingSM} class={classes.message}>
                {props.message}
            </Header>
            <Show when={props.description}>
                <Text tag={TextTags.textSM} class={classes.description}>
                    {props.description}
                </Text>
            </Show>
            <div class={classes.actions}>
                <Show when={props.actionLabel && props.onAction}>
                    <Button size={ButtonSizes.LARGE} onClick={props.onAction}>
                        {props.actionLabel}
                    </Button>
                </Show>
                <Show when={props.linkHref && props.linkLabel}>
                    <LinkButton href={props.linkHref!}>{props.linkLabel}</LinkButton>
                </Show>
            </div>
        </div>
    );
}
