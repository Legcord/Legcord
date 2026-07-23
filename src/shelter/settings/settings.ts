import type { Settings, ValidMods } from "../../@types/settings.js";

const {
    plugin: { store },
} = shelter;

export let isRestartRequired = false;

export function setRestartRequired() {
    isRestartRequired = true;
}

export function refreshSettings() {
    store.settings = window.legcord.settings.getConfig();
}

export function refreshThemes() {
    store.themes = window.legcord.themes.getThemes();
}

/** Nearest scrollable ancestor — Discord's settings content scroller. */
function findScrollableAncestor(start: Element | null | undefined): HTMLElement | null {
    let el = start instanceof HTMLElement ? start : (start?.parentElement ?? null);
    while (el) {
        const { overflowY } = getComputedStyle(el);
        if (
            (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
            el.scrollHeight > el.clientHeight + 1
        ) {
            return el;
        }
        el = el.parentElement;
    }
    return null;
}

function findSettingsScroller(): HTMLElement | null {
    // Prefer a scroller that currently contains focus / active control.
    const fromFocus = findScrollableAncestor(document.activeElement);
    if (fromFocus) return fromFocus;

    for (const root of document.querySelectorAll("shltr-rroot")) {
        const found = findScrollableAncestor(root.parentElement);
        if (found) return found;
    }
    return null;
}

/** Keep Discord's settings scroller put across store/DOM updates. */
export function withPreservedSettingsScroll<T>(run: () => T): T {
    const scroller = findSettingsScroller();
    const top = scroller?.scrollTop ?? 0;
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const result = run();
    if (!scroller) return result;

    const restore = () => {
        if (scroller.scrollTop !== top) scroller.scrollTop = top;
        // Re-focus without scrolling — Discord/React remounts can move focus to the top.
        if (active && document.contains(active) && document.activeElement !== active) {
            try {
                active.focus({ preventScroll: true });
            } catch {
                /* ignore */
            }
        }
    };
    restore();
    queueMicrotask(restore);
    requestAnimationFrame(() => {
        restore();
        requestAnimationFrame(restore);
    });
    // Late layout passes (Switch remounts, panel height changes).
    setTimeout(restore, 0);
    setTimeout(restore, 50);
    return result;
}

export function setConfig<K extends keyof Settings>(key: K, value: Settings[K], shouldRestart?: boolean) {
    withPreservedSettingsScroll(() => {
        // Mutate in place — do NOT replace store.settings (that remounts the page and jumps scroll).
        store.settings[key] = value;
        console.log(key, ":", store.settings[key]);
        if (shouldRestart) {
            isRestartRequired = true;
        }
        window.legcord.settings.setConfig(key, value);
    });
}

function removeMod(array: ValidMods[], filter: ValidMods) {
    return array.filter((i) => i !== filter);
}

export function toggleMod(mod: ValidMods, enabled: boolean) {
    isRestartRequired = true;
    const currentMods = store.settings.mods as ValidMods[];
    if (enabled) {
        if (mod === "vencord") {
            setConfig("mods", [...removeMod(currentMods, "equicord"), "vencord"]);
        } else if (mod === "equicord") {
            setConfig("mods", [...removeMod(currentMods, "vencord"), "equicord"]);
        }
    } else {
        setConfig("mods", removeMod(currentMods, mod));
    }
}

export function isMinWindowsVersion(major: number, minor: number, build: number) {
    const [sys_major, sys_minor, sys_build] = window.legcord.osRelease
        .split(".")
        .map((val, _, __) => Number.parseInt(val, 10));
    return sys_major >= major && sys_minor >= minor && sys_build >= build;
}
