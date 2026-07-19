/**
 * Legcord Clipboard Fallback
 *
 * Discord's web UI uses navigator.clipboard.writeText for actions such as
 * "Copy User ID" and "Copy Message Link", and navigator.clipboard.write for
 * richer clipboard payloads such as images. In some Legcord/Electron/macOS
 * combinations Chromium rejects those calls because the document is not focused
 * or the clipboard permission is not granted, leaving the clipboard unchanged.
 *
 * This renderer plugin replaces those APIs with selection-based copy fallbacks
 * that run inside the original click gesture.
 */
module.exports.activate = (api) => {
    const PATCH_KEY = Symbol.for("legcord.clipboardFallback.installed");

    function install() {
        try {
            if (!navigator.clipboard) {
                api.logger.warn("navigator.clipboard is unavailable");
                return;
            }

            if (navigator.clipboard[PATCH_KEY]) return;

            const originalWriteText = navigator.clipboard.writeText?.bind(navigator.clipboard);
            const originalWrite = navigator.clipboard.write?.bind(navigator.clipboard);

            async function blobToDataUrl(blob) {
                if (typeof FileReader !== "undefined") {
                    return await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(String(reader.result));
                        reader.onerror = () => reject(reader.error ?? new Error("Failed to read clipboard image"));
                        reader.readAsDataURL(blob);
                    });
                }

                // Test/runtime fallback for environments with Blob but no FileReader.
                const bytes = new Uint8Array(await blob.arrayBuffer());
                let binary = "";
                for (const byte of bytes) binary += String.fromCharCode(byte);
                const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(bytes).toString("base64");
                return `data:${blob.type || "application/octet-stream"};base64,${base64}`;
            }

            function selectElementForCopy(element) {
                const previousActiveElement = document.activeElement;
                const selection = window.getSelection?.() ?? globalThis.getSelection?.();
                const range = document.createRange();

                element.focus?.();
                range.selectNodeContents(element);
                selection?.removeAllRanges();
                selection?.addRange(range);

                const copied = document.execCommand("copy");

                selection?.removeAllRanges();
                if (previousActiveElement && typeof previousActiveElement.focus === "function") {
                    try {
                        previousActiveElement.focus();
                    } catch {}
                }

                if (!copied) throw new Error("document.execCommand('copy') returned false");
            }

            async function fallbackCopyText(text) {
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

            async function getClipboardItemType(item, type) {
                if (!item?.types?.includes(type) || typeof item.getType !== "function") return null;
                return await item.getType(type);
            }

            async function fallbackCopyItems(items) {
                const parent = document.body || document.documentElement;
                if (!parent) throw new Error("No document body available for clipboard fallback");

                const container = document.createElement("div");
                container.contentEditable = "true";
                container.setAttribute("aria-hidden", "true");
                container.style.position = "fixed";
                container.style.left = "-9999px";
                container.style.top = "0";
                container.style.width = "1px";
                container.style.height = "1px";
                container.style.overflow = "hidden";

                for (const item of items) {
                    const htmlBlob = await getClipboardItemType(item, "text/html");
                    if (htmlBlob) {
                        container.innerHTML += await htmlBlob.text();
                        continue;
                    }

                    const textBlob = await getClipboardItemType(item, "text/plain");
                    if (textBlob) {
                        const span = document.createElement("span");
                        span.textContent = await textBlob.text();
                        container.appendChild(span);
                        continue;
                    }

                    const imageType = item?.types?.find((type) => type.startsWith("image/"));
                    if (imageType && typeof item.getType === "function") {
                        const imageBlob = await item.getType(imageType);
                        const image = document.createElement("img");
                        image.src = await blobToDataUrl(imageBlob);
                        image.alt = "";
                        container.appendChild(image);
                    }
                }

                if (!container.innerHTML && !container.textContent && !container.children?.length) {
                    throw new Error("No supported clipboard item types found");
                }

                parent.appendChild(container);
                selectElementForCopy(container);
                container.remove();
            }

            if (originalWriteText) {
                Object.defineProperty(navigator.clipboard, "writeText", {
                    configurable: true,
                    value: async (text) => {
                        try {
                            await fallbackCopyText(text);
                            api.logger.log("copied text via fallback", text);
                        } catch (fallbackError) {
                            api.logger.warn("text fallback failed; trying original writeText", fallbackError);
                            return originalWriteText(text);
                        }
                    },
                });
            }

            if (originalWrite) {
                Object.defineProperty(navigator.clipboard, "write", {
                    configurable: true,
                    value: async (items) => {
                        try {
                            await fallbackCopyItems(items);
                            api.logger.log("copied rich clipboard payload via fallback");
                        } catch (fallbackError) {
                            api.logger.warn("rich clipboard fallback failed; trying original write", fallbackError);
                            return originalWrite(items);
                        }
                    },
                });
            }

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
