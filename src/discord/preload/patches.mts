import { addScript, addStyle, injectJS } from "../../common/dom.js";
import { sleep } from "../../common/sleep.js";
const { ipcRenderer } = require("electron");
const version = ipcRenderer.sendSync("displayVersion") as string;

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
        injectJS("legcord://assets/js/rpc.js");
        addStyle("legcord://assets/css/discord.css");
    });
    // Settings info version injection
    setInterval(() => {
        const host = document.querySelector('[class*="sidebar"] [class*="info"]');
        if (!host || host.querySelector("#ac-ver")) {
            return;
        }

        const discordVersionInfoPattern = /(stable|ptb|canary) \d+|Electron|Chromium/i;
        if (!discordVersionInfoPattern.test(host.textContent || "")) {
            return;
        }

        const el = host.firstElementChild!.cloneNode() as HTMLSpanElement;
        el.id = "ac-ver";
        el.textContent = `Legcord Version: ${version}`;
        host.append(el);
    }, 1000);
}
load();
