import { For, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import classes from "./Dropdown.module.css";

export const Dropdown = (props: {
    value: string | number;
    onChange: (val: string) => void;
    options: { label: string; value: string | number }[];
    limitHeight?: boolean | undefined;
}) => {
    const [open, set] = createSignal(false);
    const [maxHeight, setMaxHeight] = createSignal("");
    let container: HTMLDivElement | undefined;

    const handler = (e: MouseEvent) => !container?.contains(e.target as Node) && set(false);

    onMount(() => document.addEventListener("click", handler));
    onCleanup(() => document.removeEventListener("click", handler));

    createEffect(() => {
        if (!open() || !props.limitHeight) return;

        const rect = container?.parentElement?.getBoundingClientRect();
        if (!rect) return;

        setMaxHeight(`${rect.bottom - container!.getBoundingClientRect().bottom - 20}px`);
    });

    const text = createMemo(() => props.options.find((o) => o.value === props.value)?.label ?? props.value);

    return (
        // biome-ignore lint/a11y/useSemanticElements: FIX-ME
        <div ref={container} class={classes.container} role="button" tabIndex="0">
            <div class={classes.valuewrapper} onClick={() => set(!open())}>
                <div class={classes.value} data-text-variant="text-md/medium">
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
                <div class={classes.list} style={props.limitHeight ? { "max-height": maxHeight() } : {}}>
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
