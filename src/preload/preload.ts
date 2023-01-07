import "./bridge";
import "./patch";

import {ipcRenderer} from "electron";
import * as fs from "fs";
import * as path from "path";
import {addScript, addStyle, sleep} from "../utils";
import {injectMobileStuff} from "./mobile";
import {fixTitlebar, injectTitlebar} from "./titlebar";

window.localStorage.setItem("hideNag", "true");

if (ipcRenderer.sendSync("legacyCapturer")) {
    console.warn("Using legacy capturer module");
    import("./capturer");
}

var version = ipcRenderer.sendSync("displayVersion");
var channel = ipcRenderer.sendSync("channel");
async function updateLang() {
    if (window.location.href.indexOf("setup.html") > -1) {
        console.log("Setup, skipping lang update");
    } else {
        const value = `; ${document.cookie}`;
        const parts: any = value.split(`; locale=`);
        if (parts.length === 2) ipcRenderer.send("setLang", parts.pop().split(";").shift());
    }
}
declare global {
    interface Window {
        armcord: any;
    }
}

console.log("ArmCord " + version);
ipcRenderer.on("themeLoader", (event, message) => {
    addStyle(message);
});
if (window.location.href.indexOf("splash.html") > -1) {
    console.log("Skipping titlebar injection and client mod injection.");
} else {
    if (ipcRenderer.sendSync("titlebar")) {
        injectTitlebar();
    }
    if (ipcRenderer.sendSync("mobileMode")) {
        injectMobileStuff();
    }
    sleep(5000).then(async () => {
        // dirty hack to make clicking notifications focus ArmCord
        addScript(`
        (() => {
        const originalSetter = Object.getOwnPropertyDescriptor(Notification.prototype, "onclick").set;
        Object.defineProperty(Notification.prototype, "onclick", {
            set(onClick) {
            originalSetter.call(this, function() {
                onClick.apply(this, arguments);
                armcord.window.show();
            })
            },
            configurable: true
        });
        })();
        `);
        if (ipcRenderer.sendSync("disableAutogain")) {
            addScript(fs.readFileSync(path.join(__dirname, "../", "/content/js/disableAutogain.js"), "utf8"));
        }
        addScript(fs.readFileSync(path.join(__dirname, "../", "/content/js/rpc.js"), "utf8"));
        const cssPath = path.join(__dirname, "../", "/content/css/discord.css");
        addStyle(fs.readFileSync(cssPath, "utf8"));
        if (document.getElementById("window-controls-container") == null) {
            console.warn("Titlebar didn't inject, retrying...");
            if (ipcRenderer.sendSync("titlebar")) {
                fixTitlebar();
            }
        }
        await updateLang();
    });
}

// Settings info version injection
setInterval(() => {
    const host = document.querySelector("nav > [class|=side] [class|=info]");
    if (!host || host.querySelector("#ac-ver")) return;
    const el = host.firstChild!.cloneNode() as HTMLSpanElement;
    el.id = "ac-ver";

    el.textContent = `ArmCord Version: ${version}`;
    el.onclick = () => ipcRenderer.send("openSettingsWindow");
    host.append(el);
}, 2000);
