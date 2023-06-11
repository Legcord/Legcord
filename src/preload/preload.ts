import "./bridge";
import "./patch";
import "./optimizer";

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

const version = ipcRenderer.sendSync("displayVersion");
async function updateLang(): Promise<void> {
    const value = `; ${document.cookie}`;
    const parts: any = value.split(`; locale=`);
    if (parts.length === 2) ipcRenderer.send("setLang", parts.pop().split(";").shift());
}
declare global {
    interface Window {
        armcord: any;
    }
}

console.log(`ArmCord ${version}`);
ipcRenderer.on("themeLoader", (_event, message) => {
    addStyle(message);
});

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

// Settings info version injection
setInterval(() => {
    const host = document.querySelector<HTMLDivElement>("nav > [class|=side] [class|=info]");
    if (!host || host.querySelector("#ac-ver")) {
        return;
    }

    const el = host.firstElementChild!.cloneNode() as HTMLSpanElement;
    el.id = "ac-ver";
    el.textContent = `ArmCord Version: ${version}`;
    el.onclick = () => ipcRenderer.send("openSettingsWindow");
    host.append(el);
    let advanced = document
        .querySelector('[class*="socialLinks-"]')!
        .parentElement!.querySelector(
            '[class*="header"] + [class*="item"] + [class*="item"] + [class*="item"] + [class*="item"] + [class*="item"] + [class*="item"] + [class*="item"] + [class*="item"] + [class*="item"]'
        );
    if (!advanced) return;
    if (advanced.nextSibling instanceof Element && advanced.nextSibling.className.includes("item")) {
        advanced = advanced.nextSibling;
    }
    const acSettings = advanced.cloneNode(true) as HTMLElement;
    const tManager = advanced.cloneNode(true) as HTMLElement;
    const fQuit = advanced.cloneNode(true) as HTMLElement;
    acSettings.textContent = "ArmCord";
    acSettings.id = "acSettings";
    acSettings.onclick = () => ipcRenderer.send("openSettingsWindow");
    tManager.textContent = "Themes";
    tManager.id = "acThemes";
    tManager.onclick = () => ipcRenderer.send("openManagerWindow");
    fQuit.textContent = "Force Quit";
    fQuit.id = "acForceQuit";
    fQuit.onclick = () => ipcRenderer.send("win-quit");
    advanced.insertAdjacentElement("afterend", acSettings);
    advanced.insertAdjacentElement("afterend", tManager);
    advanced.insertAdjacentElement("afterend", fQuit);
}, 1000);
