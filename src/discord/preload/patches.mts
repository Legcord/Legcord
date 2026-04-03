import { addScript, addStyle, injectJS } from "../../common/dom.js";
import { sleep } from "../../common/sleep.js";
const { ipcRenderer } = require("electron");
const version = ipcRenderer.sendSync("displayVersion") as string;

{
    const script = document.createElement("script");
    script.textContent = `if (window.PublicKeyCredential) {
    try {
        Object.defineProperty(PublicKeyCredential, "isConditionalMediationAvailable", {
            value: async () => false, writable: true, configurable: true
        });
        Object.defineProperty(PublicKeyCredential, "getClientCapabilities", {
            value: async () => ({}), writable: true, configurable: true
        });
    } catch {}
}`;

    if (document.documentElement) {
        document.documentElement.prepend(script);
    } else {
        const observer = new MutationObserver(() => {
            if (document.documentElement) {
                observer.disconnect();
                document.documentElement.prepend(script);
            }
        });
        observer.observe(document, { childList: true });
    }
}

// Fix: Chromium on macOS ignores video deviceId when passed as an "ideal" constraint
// (plain string), always returning the first camera. Discord passes deviceId this way.
// This patch promotes "ideal" to "exact", stops active tracks before switching so macOS
// releases the hardware, and falls back to the original behavior if "exact" fails.
// Injected into the page context because contextIsolation is enabled.
// See: https://github.com/electron/electron/issues/44502
{
    const cameraFixScript = document.createElement("script");
    cameraFixScript.textContent = `(function() {
    var _origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    var _activeVideoStreams = [];
    var _activeAudioStreams = [];

    function stopTrackedStreams(list, kind) {
        for (var i = 0; i < list.length; i++) {
            var stream = list[i].deref();
            if (stream) {
                var tracks = kind === "video" ? stream.getVideoTracks() : stream.getAudioTracks();
                for (var j = 0; j < tracks.length; j++) {
                    if (tracks[j].readyState === "live") tracks[j].stop();
                }
            }
        }
        list.length = 0;
    }

    function trackStream(stream) {
        var ref = new WeakRef(stream);
        if (stream.getVideoTracks().length > 0) _activeVideoStreams.push(ref);
        if (stream.getAudioTracks().length > 0) _activeAudioStreams.push(ref);
    }

    navigator.mediaDevices.getUserMedia = async function(constraints) {
        var hasVideo = constraints && constraints.video && typeof constraints.video !== "boolean";
        var hasAudio = constraints && constraints.audio && typeof constraints.audio !== "boolean";

        // Release previous hardware when new request comes in for the same kind
        if (hasVideo && _activeVideoStreams.length > 0) stopTrackedStreams(_activeVideoStreams, "video");
        if (hasAudio && _activeAudioStreams.length > 0) stopTrackedStreams(_activeAudioStreams, "audio");

        var hasStringVideoDeviceId = hasVideo && typeof constraints.video.deviceId === "string";
        if (!hasStringVideoDeviceId) {
            var stream = await _origGUM(constraints);
            trackStream(stream);
            return stream;
        }

        // Promote video "ideal" (plain string) to "exact" to force device selection
        var requestedId = constraints.video.deviceId;
        var modified = Object.assign({}, constraints);
        modified.video = Object.assign({}, constraints.video, {
            deviceId: { exact: requestedId }
        });

        // Retry with exponential backoff — first attempt is immediate, subsequent
        // attempts double the delay (50, 100, 200, 400...) until the device is released.
        var MAX_RETRIES = 5;
        var lastErr;
        var delay = 50;
        for (var i = 0; i < MAX_RETRIES; i++) {
            if (i > 0) {
                await new Promise(function(r) { setTimeout(r, delay); });
                delay *= 2;
            }
            try {
                var stream = await _origGUM(modified);
                trackStream(stream);
                return stream;
            } catch(e) {
                lastErr = e;
                if (e.name === "NotReadableError") continue;
                break;
            }
        }

        // All retries exhausted or non-retryable error — fall back to original ideal constraint
        if (lastErr) {
            console.warn("[Legcord] Exact deviceId failed, falling back to ideal:", lastErr.name, lastErr.message);
        }
        var fallbackStream = await _origGUM(constraints);
        trackStream(fallbackStream);
        return fallbackStream;
    };
})();`;

    if (document.documentElement) {
        document.documentElement.prepend(cameraFixScript);
    } else {
        const fixObserver = new MutationObserver(() => {
            if (document.documentElement) {
                fixObserver.disconnect();
                document.documentElement.prepend(cameraFixScript);
            }
        });
        fixObserver.observe(document, { childList: true });
    }
}

export async function getVirtmic() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevice = devices.find(({ label }) => label === "vencord-screen-share");
        return audioDevice?.deviceId;
    } catch (error) {
        return null;
    }
}

async function load() {
    await sleep(5000).then(() => {
        const original = navigator.mediaDevices.getDisplayMedia;
        navigator.mediaDevices.getDisplayMedia = async function (opts) {
            const stream = await original.call(this, opts);
            const id = await getVirtmic();

            if (id) {
                const audio = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: {
                            exact: id,
                        },
                        autoGainControl: false,
                        echoCancellation: false,
                        noiseSuppression: false,
                    },
                });
                audio.getAudioTracks().forEach((t) => stream.addTrack(t));
            }

            return stream;
        };

        // dirty hack to make clicking notifications focus Legcord
        addScript(`
        (() => {
        const originalSetter = Object.getOwnPropertyDescriptor(Notification.prototype, "onclick").set;
        Object.defineProperty(Notification.prototype, "onclick", {
            set(onClick) {
            originalSetter.call(this, function() {
                onClick.apply(this, arguments);
                legcord.window.show();
            })
            },
            configurable: true
        });
        })();
        `);
        addScript(`
        shelter.plugins.removePlugin("armcord-settings")
        shelter.plugins.removePlugin("armcord-screenshare")
    `);
        if (ipcRenderer.sendSync("getConfig", "disableAutogain")) {
            injectJS("legcord://assets/js/disableAutogain.js");
        }
        addStyle("legcord://assets/css/discord.css");
    });
    injectJS("legcord://assets/js/patchVencordQuickCSS.js");
    // Settings info version injection
    const observer = new MutationObserver(() => {
        if (document.body.querySelector("#ac-ver")) return;

        const info = document.body.querySelector('[class*="sidebar"] [class*="compactInfo"]');
        const host = info?.parentElement;
        if (!host || !/(stable|ptb|canary) \d+|Electron|Chromium/i.test(host.textContent)) return;

        const el = host.querySelector("span")!.cloneNode() as HTMLSpanElement;
        el.id = "ac-ver";
        el.textContent = `Legcord Version: ${version}`;
        info.after(el);
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
load();
