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

    function stopActiveVideoTracks() {
        for (var i = 0; i < _activeVideoStreams.length; i++) {
            var stream = _activeVideoStreams[i].deref();
            if (stream) {
                var tracks = stream.getVideoTracks();
                for (var j = 0; j < tracks.length; j++) {
                    tracks[j].stop();
                }
            }
        }
        _activeVideoStreams = [];
    }

    navigator.mediaDevices.getUserMedia = async function(constraints) {
        if (!constraints || !constraints.video || typeof constraints.video === "boolean" ||
            !constraints.video.deviceId || typeof constraints.video.deviceId !== "string") {
            return _origGUM(constraints);
        }

        var requestedId = constraints.video.deviceId;

        // Stop existing video tracks so macOS releases the camera hardware
        stopActiveVideoTracks();
        await new Promise(function(r) { setTimeout(r, 300); });

        // Promote "ideal" (plain string) to "exact" to force device selection
        var modified = Object.assign({}, constraints);
        modified.video = Object.assign({}, constraints.video, {
            deviceId: { exact: requestedId }
        });

        var stream;
        try {
            stream = await _origGUM(modified);
        } catch(e) {
            if (e.name === "OverconstrainedError") {
                // exact failed — fall back to original ideal constraint
                console.warn("[Legcord] Exact deviceId failed, falling back to ideal:", e.message);
                stream = await _origGUM(constraints);
            } else {
                throw e;
            }
        }

        if (stream.getVideoTracks().length > 0) {
            _activeVideoStreams.push(new WeakRef(stream));
        }
        return stream;
    };
    console.log("[Legcord] Camera device selection fix applied");
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
