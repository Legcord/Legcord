import type { Component, JSX } from "solid-js";
import { createSignal, Show } from "solid-js";
import classes from "./SettingsPanel.module.css";

const {
    ui: { Header, HeaderTags },
} = shelter;

/** Survives SettingsPanel / SettingsPage remounts (e.g. after toggling a setting). */
const persistedOpen: Record<string, boolean> = {};

export type SettingsPanelProps = {
    /** Stable id used to remember open/closed across remounts. */
    id: string;
    title: string;
    description?: string;
    icon: Component;
    children: JSX.Element;
    /**
     * When true, the panel is forced open (search). Manual toggles are ignored
     * until forceOpen is cleared — matching Shelter’s settings panels.
     */
    forceOpen?: boolean;
    defaultOpen?: boolean;
    /** Hide the panel entirely (e.g. no search matches). */
    hidden?: boolean;
};

const CaretIcon = (props: { open: boolean }) => (
    <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        fill="none"
        viewBox="0 0 24 24"
        class={classes.caretIcon}
        style={{ transform: props.open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
        <path
            fill="currentColor"
            d="M5.3 9.3a1 1 0 0 1 1.4 0l5.3 5.29 5.3-5.3a1 1 0 1 1 1.4 1.42l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.42Z"
        />
    </svg>
);

export function SettingsPanel(props: SettingsPanelProps) {
    const [internalOpen, setInternalOpen] = createSignal(persistedOpen[props.id] ?? props.defaultOpen ?? false);

    const isOpen = () => Boolean(props.forceOpen) || internalOpen();

    function toggle() {
        if (props.forceOpen) return;
        const next = !internalOpen();
        persistedOpen[props.id] = next;
        setInternalOpen(next);
    }

    return (
        <div
            class={`${classes.container} ${isOpen() ? classes.containerOpened : ""}`}
            style={{ display: props.hidden ? "none" : undefined }}
        >
            <button type="button" class={classes.header} onClick={toggle} aria-expanded={isOpen()}>
                <div class={classes.icon}>
                    <props.icon />
                </div>
                <div class={classes.title}>
                    <Header tag={HeaderTags.H5} class={classes.titleText}>
                        {props.title}
                    </Header>
                    <Show when={props.description}>
                        <div class={classes.description}>{props.description}</div>
                    </Show>
                </div>
                <div class={classes.caret}>
                    <CaretIcon open={isOpen()} />
                </div>
            </button>
            <div class={`${classes.section} ${isOpen() ? classes.sectionOpened : ""}`}>{props.children}</div>
        </div>
    );
}
