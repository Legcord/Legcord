import electron from "electron";
import { getConfig, setConfig } from "../../common/config.js";

const LEGCORD_CSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.discord.com https://discord.com https://*.githubusercontent.com https://*.github.com",
    "style-src 'self' 'unsafe-inline' https://*.discord.com https://discord.com https://fonts.googleapis.com",
    "img-src 'self' blob: data: https://*.discord.com https://discord.com https://*.discordapp.com https://cdn.discordapp.com https://*.githubusercontent.com https://*.github.com https://raw.githubusercontent.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' blob: https://*.discord.com https://discord.com wss://*.discord.com wss://gateway.discord.gg https://*.githubusercontent.com https://*.github.com https://api.github.com",
    "media-src 'self' blob: https://*.discord.com https://discord.com",
    "worker-src 'self' blob:",
    "frame-src 'self' https://*.discord.com https://discord.com https://*.youtube.com https://youtube.com https://*.twitch.tv https://open.spotify.com",
].join("; ");

const setupCSP = (): void => {
    console.log("Setting up Legcord CSP policy...");

    electron.session.defaultSession.webRequest.onHeadersReceived(
        (details: electron.OnHeadersReceivedListenerDetails, callback: (response: electron.Response) => void) => {
            const { responseHeaders, resourceType } = details;
            if (!responseHeaders) return callback({});

            if (resourceType === "mainFrame") {
                responseHeaders["content-security-policy"] = [LEGCORD_CSP];
            } else if (resourceType === "stylesheet") {
                // Fix hosts that don't properly set the css content type, such as
                // raw.githubusercontent.com
                responseHeaders["content-type"] = ["text/css"];
            }
            return callback({ responseHeaders });
        },
    );
};

void electron.app.whenReady().then(() => {
    // NOTE - Awaiting the line above will hang the app.
    if (getConfig("legcordCSP") === undefined) setConfig("legcordCSP", true);
    if (getConfig("legcordCSP")) {
        setupCSP();
    } else {
        console.log("Legcord CSP is disabled. The CSP should be managed by a third-party plugin(s).");
    }
});
