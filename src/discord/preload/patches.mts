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

// Raise Chromium's ~2500kbps screenshare SDP cap before Discord binds RTCPeerConnection.
// Shelter plugins load too late / MediaEngine may keep the original method reference.
// On macOS/Windows also rewrite H.264 Constrained Baseline → Baseline on local *and* remote SDP:
// Discord's Go Live answer forces profile-level-id=42e01f (OpenH264); local-only munging
// is overwritten by setRemoteDescription, so the answer must be rewritten too.
// Without this, Windows burns CPU on OpenH264 even when Media Foundation HW encode is available.
// Gated by settings.sdpH264BaselineRewrite (default on) so users can disable if negotiation breaks.
{
    const rewriteBaselineSetting = ipcRenderer.sendSync("getConfig", "sdpH264BaselineRewrite") as boolean | undefined;
    const preferHwH264 =
        (process.platform === "darwin" || process.platform === "win32") && (rewriteBaselineSetting ?? true);
    const bitrateScript = document.createElement("script");
    bitrateScript.textContent = `(function () {
    var CAP = "80000";
    // Modest floor/start (kbps) so GCC probes above Discord's ~1–2.5 Mbps screenshare default
    // without fighting congestion control. Max remains the hard ceiling.
    var MIN_BR = "3000";
    var START_BR = "3000";
    // VideoToolbox (macOS) and Media Foundation (Windows) HW encode avoid OpenH264 CBP.
    var preferHwH264 = ${preferHwH264 ? "true" : "false"};
    function setOrAppendFmtpParam(sdp, key, value) {
        var re = new RegExp(key + "=\\\\d+", "g");
        if (sdp.indexOf(key + "=") !== -1) {
            return sdp.replace(re, key + "=" + value);
        }
        return sdp.replace(/(a=fmtp:\\d+ [^\\r\\n]*)/g, function (line) {
            if (line.indexOf(key + "=") !== -1) return line;
            return line + ";" + key + "=" + value;
        });
    }
    function mungeSdp(sdp) {
        if (!sdp || typeof sdp !== "string") return sdp;
        var out = sdp;
        // Chromium uses OpenH264 for Constrained Baseline (42e0xx). Rewrite to Baseline
        // (4200xx) so VideoToolbox / Media Foundation HW H.264 can be selected.
        // See discuss-webrtc: CBP uses software encoder for historical reasons.
        if (preferHwH264) {
            out = out.replace(/profile-level-id=42e0([0-9a-fA-F]{2})/gi, "profile-level-id=4200$1");
        }
        out = setOrAppendFmtpParam(out, "x-google-max-bitrate", CAP);
        out = setOrAppendFmtpParam(out, "x-google-min-bitrate", MIN_BR);
        out = setOrAppendFmtpParam(out, "x-google-start-bitrate", START_BR);
        return out;
    }
    function wrapDescription(desc) {
        if (!desc || !desc.sdp) return desc;
        var sdp = mungeSdp(desc.sdp);
        if (sdp === desc.sdp) return desc;
        try {
            return new RTCSessionDescription({ type: desc.type, sdp: sdp });
        } catch (e) {
            return Object.assign({}, desc, { sdp: sdp });
        }
    }
    var proto = window.RTCPeerConnection && window.RTCPeerConnection.prototype;
    if (!proto) return;
    var origSLD = proto.setLocalDescription;
    proto.setLocalDescription = function (desc) {
        var args = Array.prototype.slice.call(arguments);
        if (args.length > 0) args[0] = wrapDescription(args[0]);
        return origSLD.apply(this, args);
    };
    var origSRD = proto.setRemoteDescription;
    proto.setRemoteDescription = function (desc) {
        var args = Array.prototype.slice.call(arguments);
        if (args.length > 0) args[0] = wrapDescription(args[0]);
        return origSRD.apply(this, args);
    };
    var origOffer = proto.createOffer;
    proto.createOffer = function () {
        var self = this;
        var args = arguments;
        return Promise.resolve(origOffer.apply(self, args)).then(function (offer) {
            return wrapDescription(offer) || offer;
        });
    };
    var origAnswer = proto.createAnswer;
    if (origAnswer) {
        proto.createAnswer = function () {
            var self = this;
            var args = arguments;
            return Promise.resolve(origAnswer.apply(self, args)).then(function (answer) {
                return wrapDescription(answer) || answer;
            });
        };
    }
    // Do NOT patch RTCRtpSender.setParameters to force high maxBitrate — that fights
    // Discord/WebRTC congestion control and collapses streams to tiny resolutions.
    console.log("[Legcord] Early WebRTC screenshare SDP patch installed" + (preferHwH264 ? " (H264 CBP→Baseline on local+remote)" : ""));
})();`;

    if (document.documentElement) {
        document.documentElement.prepend(bitrateScript);
    } else {
        const observer = new MutationObserver(() => {
            if (document.documentElement) {
                observer.disconnect();
                document.documentElement.prepend(bitrateScript);
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
// Stopping prior audio streams on every new getUserMedia breaks Discord on Windows/Linux
// (multiple object-shaped audio requests); keep that behavior only on darwin.
{
    const stopPrevAudioStreams = process.platform === "darwin";
    const cameraFixScript = document.createElement("script");
    cameraFixScript.textContent = `(function() {
    var legcordStopPrevAudioStreams = ${stopPrevAudioStreams};
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
        if (legcordStopPrevAudioStreams && stream.getAudioTracks().length > 0) _activeAudioStreams.push(ref);
    }

    navigator.mediaDevices.getUserMedia = async function(constraints) {
        var hasVideo = constraints && constraints.video && typeof constraints.video !== "boolean";
        var hasAudio = constraints && constraints.audio && typeof constraints.audio !== "boolean";

        // Release previous hardware when new request comes in for the same kind (audio: darwin only)
        if (hasVideo && _activeVideoStreams.length > 0) stopTrackedStreams(_activeVideoStreams, "video");
        if (legcordStopPrevAudioStreams && hasAudio && _activeAudioStreams.length > 0) stopTrackedStreams(_activeAudioStreams, "audio");

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

async function load() {
    await sleep(5000).then(() => {
        // Venmic audio injection lives in the Shelter screenshare getDisplayMedia patch.
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
    addScript(`(() => {
        const versionElm = document.createElement("style");
        versionElm.appendChild(document.createTextNode(\`
            div[class*="compactInfo"] {
                margin-bottom: 15px;
            }
            div[class*="compactInfo"] > span::before {
                content: "Legcord Version: ${version}";
                color: inherit;
                position: absolute;
                margin-top: 20px;
            }
        \`));
        document.body.append(versionElm);
    })()`);
}
load();
