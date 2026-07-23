import type { LegcordPluginInfo } from "../../../@types/legcordWindow.js";
import classes from "./PluginCard.module.css";

const {
    ui: { Header, HeaderTags, Switch, Button, ButtonSizes },
    plugin: { store },
} = shelter;

export function PluginCard(props: {
    plugin: LegcordPluginInfo;
    busy: boolean;
    onToggle: (enabled: boolean) => void;
    onReload: () => void;
}) {
    const t = store.i18n;
    const targets = [
        props.plugin.hasMain ? "main" : null,
        props.plugin.hasPreload ? "preload" : null,
        props.plugin.hasRenderer ? "renderer" : null,
    ]
        .filter((value): value is string => value !== null)
        .join(", ");

    return (
        <div class={classes.card}>
            <div class={classes.main}>
                <div class={classes.titleRow}>
                    <Header tag={HeaderTags.HeadingLG} class={classes.title}>
                        {props.plugin.name}
                    </Header>
                    <Switch checked={props.plugin.enabled} onChange={props.onToggle} disabled={props.busy} />
                </div>
                <div class={classes.meta}>
                    {props.plugin.id} • v{props.plugin.version}
                    {props.plugin.author ? ` • ${props.plugin.author}` : ""}
                </div>
                {props.plugin.description ? <div class={classes.description}>{props.plugin.description}</div> : null}
                <div class={classes.targets}>
                    {t["plugins-targets"]}: {targets || t["plugins-targetsNone"]}
                </div>
                {!props.plugin.compatible ? (
                    <div class={classes.description}>
                        {props.plugin.compatibilityMessage ?? t["plugins-incompatible"]}
                    </div>
                ) : null}
            </div>
            <div class={classes.actions}>
                <Button
                    size={ButtonSizes.SMALL}
                    onClick={props.onReload}
                    disabled={props.busy || !props.plugin.enabled}
                    tooltip={t["plugins-reload"]}
                >
                    {t["plugins-reload"]}
                </Button>
            </div>
        </div>
    );
}
