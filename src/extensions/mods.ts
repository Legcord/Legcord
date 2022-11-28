import electron from "electron";
import {getConfig} from "../utils";

const unstrictCSP = async () => {
    console.log("Setting up CSP unstricter...");

    const cspAllowAll = ["style-src", "connect-src", "img-src", "font-src", "media-src", "child-src"];

    const isVencord = await getConfig("mods").then((s) => s.includes("vencord"));
    electron.session.defaultSession.webRequest.onHeadersReceived(({responseHeaders}, done) => {
        let csp = responseHeaders!["content-security-policy"];

        if (csp) {
            for (const directive of cspAllowAll) {
                csp[0] = csp[0].replace(new RegExp(`${directive}.+?;`), `${directive} * blob: data: 'unsafe-inline';`);
            }

            if (isVencord) {
                // unpkg and cdnjs are used for QuickCss and some plugins' dependencies (e.g. GifEncoder & APNG for FakeNitro)
                csp[0] = csp[0].replace(
                    /script-src.+?(?=;)/,
                    "$& 'unsafe-eval' https://unpkg.com https://cdnjs.cloudflare.com"
                );
            }
            // Fix Discord's broken CSP which disallows unsafe-inline due to having a nonce (which they don't even use?)
            csp[0] = csp[0].replace(/'nonce-.+?' /, "");
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
