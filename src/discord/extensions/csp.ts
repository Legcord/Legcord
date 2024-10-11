import electron from "electron";
import { getConfig, setConfig } from "../../common/config.js";

const unrestrictCSP = (): void => {
    console.log("Setting up CSP unrestricter...");

    electron.session.defaultSession.webRequest.onHeadersReceived(({ responseHeaders, resourceType }, done) => {
        if (!responseHeaders) return done({});

        if (resourceType === "mainFrame") {
            (responseHeaders["content-security-policy"] as unknown) = undefined; // REVIEW - CHECK THIS WORKS
        } else if (resourceType === "stylesheet") {
            // Fix hosts that don't properly set the css content type, such as
            // raw.githubusercontent.com
            responseHeaders["content-type"] = ["text/css"];
        }
        return done({ responseHeaders });
    });
};

void electron.app.whenReady().then(() => {
    // NOTE - Awaiting the line above will hang the app.
    if (getConfig("legcordCSP") === undefined) setConfig("legcordCSP", true);
    if (getConfig("legcordCSP")) {
        unrestrictCSP();
    } else {
        console.log("Legcord CSP is disabled. The CSP should be managed by a third-party plugin(s).");
    }
});
