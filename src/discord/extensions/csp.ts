import electron from "electron";
import { getConfig } from "../../common/config.js";

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

function setupStrictCSP() {
    console.log("Setting up Strict CSP policy...");

    electron.session.defaultSession.webRequest.onHeadersReceived(
        (
            details: electron.OnHeadersReceivedListenerDetails,
            callback: (headersReceivedResponse: electron.HeadersReceivedResponse) => void,
        ) => {
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
}

function setupNoCSP() {
    console.log("Setting up CSP unrestricter...");

    electron.session.defaultSession.webRequest.onHeadersReceived(({ responseHeaders, resourceType }, done) => {
        if (!responseHeaders) return done({});

        if (resourceType === "mainFrame") {
            (responseHeaders["content-security-policy"] as unknown) = undefined;
        } else if (resourceType === "stylesheet") {
            // Fix hosts that don't properly set the css content type, such as
            // raw.githubusercontent.com
            responseHeaders["content-type"] = ["text/css"];
        }
        return done({ responseHeaders });
    });
}

void electron.app.whenReady().then(() => {
    const cspSetting = getConfig("csp") || "none"; // none is the old default when the setting didn't exist, so we default to that for old configs
    switch (cspSetting) {
        case "strict":
            setupStrictCSP();
            break;
        case "none":
            setupNoCSP();
            break;
        default:
            console.log("Using vanilla CSP policy.");
    }
});
