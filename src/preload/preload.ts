import "./bridge";
import "./capturer";
import "./patch"
import * as fs from "fs";
import * as path from "path";
import { injectTitlebar } from "./titlebar";
import { sleep, addStyle, injectJS } from "../utils";
import { ipcRenderer } from "electron";
import { injectTabs } from "./tabs";
declare global {
  interface Window {
    armcord: any;
  }
}
const clientMods = {
  goosemod: "https://api.goosemod.com/inject.js",
  cumcord:
    "https://raw.githubusercontent.com/Cumcord/Cumcord/stable/dist/build.js",
  flicker: "https://raw.githubusercontent.com/FlickerMod/dist/main/build.js",
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
