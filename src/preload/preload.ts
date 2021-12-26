import "./capturer";
import "./bridge";
import { injectTitlebar } from "./titlebar";
import { ipcRenderer } from "electron";
declare global {
  interface Window {
    splash: any;
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
  injectTitlebar();
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
}
