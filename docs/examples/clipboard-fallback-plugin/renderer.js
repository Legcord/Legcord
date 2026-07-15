/**
 * Legcord Clipboard Fallback
 *
 * Discord's web UI uses navigator.clipboard.writeText for actions such as
 * "Copy User ID" and "Copy Message Link". In some Legcord/Electron/macOS
 * combinations Chromium rejects that call because the document is not focused
 * or the clipboard permission is not granted, leaving the clipboard unchanged.
 *
 * This renderer plugin replaces writeText with a selection-based copy fallback
 * that runs inside the original click gesture.
 */
module.exports.activate = (api) => {
    const TAG = "[ClipboardFallback]";
    const PATCH_KEY = Symbol.for("legcord.clipboardFallback.installed");

    function install() {
        try {
            if (!navigator.clipboard?.writeText) {
                api.logger.warn("navigator.clipboard.writeText is unavailable");
                return;
            }

            if (navigator.clipboard[PATCH_KEY]) return;

            const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);

            async function fallbackCopy(text) {
                const value = String(text);
                const parent = document.body || document.documentElement;
                if (!parent) throw new Error("No document body available for clipboard fallback");

                const textarea = document.createElement("textarea");
                textarea.value = value;
                textarea.setAttribute("readonly", "");
                textarea.setAttribute("aria-hidden", "true");
                textarea.style.position = "fixed";
                textarea.style.left = "-9999px";
                textarea.style.top = "0";
                textarea.style.width = "1px";
                textarea.style.height = "1px";
                textarea.style.opacity = "0";
                textarea.style.pointerEvents = "none";

                parent.appendChild(textarea);

                const previousActiveElement = document.activeElement;
                textarea.focus();
                textarea.select();
                textarea.setSelectionRange(0, value.length);

                const copied = document.execCommand("copy");
                textarea.remove();

                if (previousActiveElement && typeof previousActiveElement.focus === "function") {
                    try {
                        previousActiveElement.focus();
                    } catch {}
                }

                if (!copied) throw new Error("document.execCommand('copy') returned false");
            }

            Object.defineProperty(navigator.clipboard, "writeText", {
                configurable: true,
                value: async (text) => {
                    try {
                        await fallbackCopy(text);
                        api.logger.log("copied via fallback", text);
                    } catch (fallbackError) {
                        api.logger.warn("fallback failed; trying original writeText", fallbackError);
                        return originalWriteText(text);
                    }
                },
            });

            Object.defineProperty(navigator.clipboard, PATCH_KEY, {
                configurable: false,
                enumerable: false,
                value: true,
            });

            api.logger.log("installed");
        } catch (error) {
            api.logger.error("install failed", error);
        }
    }

    install();
    window.addEventListener("DOMContentLoaded", install, { once: true });
};
