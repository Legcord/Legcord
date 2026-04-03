import { For, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import classes from "./Dropdown.module.css";

export const Dropdown = (props: {
    value: string | number;
    onChange: (val: string) => void;
    options: { label: string; value: string | number }[];
    styles?: { [key: string]: string };
    limitHeight?: boolean | undefined;
    class?: string;
}) => {
    const [open, set] = createSignal(false);
    const [maxHeight, setMaxHeight] = createSignal("");
    let container: HTMLDivElement | undefined;

    const handler = (e: MouseEvent) => !container?.contains(e.target as Node) && set(false);

    onMount(() => document.addEventListener("click", handler));
    onCleanup(() => document.removeEventListener("click", handler));

    createEffect(() => {
        if (!open() || !props.limitHeight) return;

        setMaxHeight("300px");
    });

    const text = createMemo(() => props.options.find((o) => o.value === props.value)?.label ?? props.value);

    return (
        <div
            ref={container}
            class={`${classes.container} ${props.class ?? ""}`.trim()}
            // biome-ignore lint/a11y/useSemanticElements: FIX-ME
            role="button"
            tabIndex="0"
            style={props.styles?.container}
        >
            <div class={classes.valuewrapper} onClick={() => set(!open())} style={props.styles?.valuewrapper}>
                <div class={classes.value} data-text-variant="text-md/medium" style={props.styles?.value}>
                    {text()}
                </div>
                <div>
                    <svg
                        aria-hidden="true"
                        role="img"
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="currentColor"
                            d="M5.3 9.3a1 1 0 0 1 1.4 0l5.3 5.29 5.3-5.3a1 1 0 1 1 1.4 1.42l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.42Z"
                        />
                    </svg>
                </div>
            </div>
            {open() && (
                <div
                    class={classes.list}
                    style={props.limitHeight ? { "max-height": maxHeight() } : props.styles?.list}
                >
                    <For each={props.options}>
                        {(opt) => (
                            <option
                                value={opt.value}
                                aria-selected={opt.value === props.value}
                                onClick={() => {
                                    props.onChange(String(opt.value));
                                    set(false);
                                }}
                            >
                                {opt.label}
                            </option>
                        )}
                    </For>
                </div>
            )}
        </div>
    );
};
