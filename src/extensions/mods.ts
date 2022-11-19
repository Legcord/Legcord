//https://github.com/GooseMod/GooseMod/wiki/Stuck-Updater-or-Blank-Window-Fix
/* 
Copyright 2022 GooseMod

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
import electron from "electron";
import {getConfig} from "../utils";
const otherMods = {
    generic: {
        electronProxy: require("util").types.isProxy(electron) // Many modern mods overwrite electron with a proxy with a custom BrowserWindow (copied from PowerCord)
    }
};

const unstrictCSP = () => {
    console.log("Setting up CSP unstricter...");

    const cspAllowAll = ["connect-src", "style-src", "img-src", "font-src"];

    const corsAllowUrls = [
        "https://raw.githubusercontent.com/Cordwood/builds/master/index.js",
        "https://github.com/Vendicated/Vencord/releases/download/devbuild/browser.js",
        "https://cors.armcord.xyz/raw.githubusercontent.com/uwu/shelter-builds/main/shelter.js"
    ];

    electron.session.defaultSession.webRequest.onHeadersReceived(({responseHeaders, url}, done) => {
        let csp = responseHeaders!["content-security-policy"];

        if (otherMods.generic.electronProxy) {
            // Since patch v16, override other mod's onHeadersRecieved (Electron only allows 1 listener); because they rely on 0 CSP at all (GM just unrestricts some areas), remove it fully if we detect other mods
            delete responseHeaders!["content-security-policy"];
            csp = [];
        }

        if (csp) {
            for (let p of cspAllowAll) {
                csp[0] = csp[0].replace(`${p}`, `${p} * blob: data:`); // * does not include data: URIs
            }

            // Fix Discord's broken CSP which disallows unsafe-inline due to having a nonce (which they don't even use?)
            csp[0] = csp[0].replace(/'nonce-.*?' /, "");
        }

        if (corsAllowUrls.some((x) => url.startsWith(x))) {
            responseHeaders!["access-control-allow-origin"] = ["*"];
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
