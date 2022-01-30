import "./bridge";
import "./capturer";
import * as fs from "fs";
import * as path from "path";
import { injectTitlebar } from "./titlebar";
import { sleep, addStyle } from "../utils";
import { ipcRenderer } from "electron";

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
async function injectJS(inject: string) {
  const js = await (await fetch(`${inject}`)).text();

  const el = document.createElement("script");

  el.appendChild(document.createTextNode(js));

  document.body.appendChild(el);
}

console.log("ArmCord");
if (window.location.href.indexOf("splash.html") > -1) {
  console.log("Skipping titlebar injection and client mod injection.");
} else {
  if (ipcRenderer.sendSync("titlebar")) {
    injectTitlebar();
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
