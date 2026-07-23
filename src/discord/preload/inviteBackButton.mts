import { addScript, addStyle } from "../../common/dom.js";

const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
    void (async () => {
        const label =
            ((await ipcRenderer.invoke("getLang", "invite-goBackToApp")) as string | undefined) ||
            "Go back to the Discord app";

        addStyle("legcord://assets/css/inviteBack.css");

        // Injected into the page world so Discord SPA history.pushState/replaceState is visible.
        addScript(`
(() => {
    const BTN_ID = "legcord-invite-back";
    const LABEL = ${JSON.stringify(label)};

    function isInvitePath(pathname) {
        const path = (pathname || "").toLowerCase();
        return path.startsWith("/invite/") || path.startsWith("/guest-invite/");
    }

    function ensureButton() {
        let btn = document.getElementById(BTN_ID);
        if (btn) return btn;
        btn = document.createElement("button");
        btn.id = BTN_ID;
        btn.type = "button";
        btn.textContent = LABEL;
        btn.setAttribute("aria-label", LABEL);
        btn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            try {
                history.pushState({}, "", "/app");
                window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
            } catch (_) {
                location.assign("/app");
            }
        });
        (document.body || document.documentElement).appendChild(btn);
        return btn;
    }

    function sync() {
        const btn = ensureButton();
        const onInvite = isInvitePath(location.pathname);
        btn.setAttribute("data-visible", onInvite ? "true" : "false");
        btn.hidden = !onInvite;
        btn.setAttribute("aria-hidden", onInvite ? "false" : "true");
    }

    function patchHistory(method) {
        const original = history[method];
        if (typeof original !== "function") return;
        history[method] = function () {
            const result = original.apply(this, arguments);
            queueMicrotask(sync);
            return result;
        };
    }

    patchHistory("pushState");
    patchHistory("replaceState");
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);

    sync();
    // Fallback for Discord navigations that do not go through history hooks.
    setInterval(sync, 1000);
})();
`);
    })();
});
