import electron from "electron";
import {getConfig} from "../utils";

const unstrictCSP = () => {
    console.log("Setting up CSP unstricter...");

    electron.session.defaultSession.webRequest.onHeadersReceived(({responseHeaders}, done) => {
        delete responseHeaders!["content-security-policy"];
        done({ responseHeaders });
    });
};

electron.app.whenReady().then(async () => {
    if (await getConfig("armcordCSP")) {
        unstrictCSP();
    } else {
        console.log("ArmCord CSP is disabled. The CSP should be managed by a third-party plugin(s).");
    }
});
