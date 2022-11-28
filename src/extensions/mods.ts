import electron from "electron";
import {getConfig} from "../utils";

interface PolicyResult {
    [key: string]: string[];
}

const parsePolicy = (policy: string): PolicyResult => {
    const result: PolicyResult = {};
    policy.split(";").forEach((directive) => {
        const [directiveKey, ...directiveValue] = directive.trim().split(/\s+/g);
        if (directiveKey && !Object.prototype.hasOwnProperty.call(result, directiveKey)) {
            result[directiveKey] = directiveValue;
        }
    });
    return result;
};

const stringifyPolicy = (policy: PolicyResult): string =>
    Object.entries(policy)
        .filter(([, values]) => values?.length)
        .map((directive) => directive.flat().join(" "))
        .join("; ");

const unstrictCSP = async () => {
    console.log("Setting up CSP unstricter...");

    const cspAllowAll = ["style-src", "connect-src", "img-src", "font-src", "media-src", "worker-src"];

    const isVencord = await getConfig("mods").then((s) => s.includes("vencord"));
    electron.session.defaultSession.webRequest.onHeadersReceived(({responseHeaders}, done) => {
        let cspHeaders = responseHeaders!["content-security-policy"];

        if (cspHeaders) {
            const csp = parsePolicy(cspHeaders[0]);

            for (const directive of cspAllowAll) {
                csp[directive] = ["*", "blob:", "data:", "'unsafe-inline'"];
            }

            if (isVencord) {
                // unpkg and cdnjs are used for QuickCss and some plugins' dependencies (e.g. GifEncoder & APNG for FakeNitro)
                csp["script-src"] ??= [];
                csp["script-src"].push("'unsafe-eval'", "https://unpkg.com", "https://cdnjs.cloudflare.com");
            }
            // Fix Discord's broken CSP which disallows unsafe-inline due to having a nonce (which they don't even use?)
            csp["script-src"] = csp["script-src"]?.filter((value) => !value.includes("nonce-"));

            cspHeaders[0] = stringifyPolicy(csp);
        }

        done({responseHeaders});
    });
};

electron.app.whenReady().then(async () => {
    if (await getConfig("armcordCSP")) {
        unstrictCSP();
    } else {
        console.log("ArmCord CSP is disabled. The CSP should be managed by a third-party plugin(s).");
    }
});
