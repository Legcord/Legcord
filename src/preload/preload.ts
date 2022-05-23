import "./bridge";
import "./capturer";
import "./patch";
import * as fs from "fs";
import * as path from "path";
import {injectTitlebar} from "./titlebar";
import {sleep, addStyle, injectJS} from "../utils";
import {ipcRenderer} from "electron";
import {injectTabs} from "./tabs";
var version = ipcRenderer.sendSync("get-app-version", "app-version");

declare global {
    interface Window {
        armcord: any;
    }
}
const clientMods = {
    goosemod: "https://api.goosemod.com/inject.js",
    cumcord: "https://raw.githubusercontent.com/Cumcord/Cumcord/stable/dist/build.js",
    flicker: "https://raw.githubusercontent.com/FlickerMod/dist/main/build.js"
};

console.log("ArmCord");
if (window.location.href.indexOf("splash.html") > -1) {
    console.log("Skipping titlebar injection and client mod injection.");
} else {
    if (ipcRenderer.sendSync("titlebar")) {
        injectTitlebar();
    }
    if (ipcRenderer.sendSync("tabs")) {
        injectTabs();
    }
    sleep(5000).then(() => {
        const cssPath = path.join(__dirname, "../", "/content/css/discord.css");
        addStyle(fs.readFileSync(cssPath, "utf8"));

        switch (ipcRenderer.sendSync("clientmod")) {
            case "goosemod":
                injectJS(clientMods.goosemod);
                console.log("Loading GooseMod...");
                break;
            case "cumcord":
                injectJS(clientMods.cumcord);
                console.log("Loading Cumcord...");
                break;
            case "flicker":
                injectJS(clientMods.flicker);
                console.log("Loading FlickerMod...");
                break;
        }
    });
}
/*
MIT License

Copyright (c) 2022 GooseNest

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
// Settings info version injection
setInterval(() => {
    const host = document.getElementsByClassName("info-3pQQBb")[0];
    if (!host || document.querySelector("#ac-ver")) return;
    const el = document.createElement("span");
    el.id = "ac-ver";
    el.classList.add("text-xs-normal-3SiVjE", "line-18uChy");

    el.textContent = `\nArmCord Version: ${version}`;
    el.onclick = () => ipcRenderer.send("openSettingsWindow");

    host.append(el);
}, 2000);
