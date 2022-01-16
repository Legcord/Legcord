import * as storage from "electron-json-storage";
import * as fs from "fs";
import { app } from "electron";

//utillity functions that are used all over the codebase or just too obscure to be put in the file used in
export function addStyle(styleString: string) {
  const style = document.createElement("style");
  style.textContent = styleString;
  document.head.append(style);
}

export function addScript(scriptString: string) {
  var script = document.createElement("script");
  script.textContent = scriptString;
  document.body.append(script);
}
export function setup() {
  console.log("Setting up ArmCord settings.");
  storage.set(
    "settings",
    {
      customTitlebar: true,
      channel: "stable",
      firstRun: "done",
      armcordCSP: true,
      mods: "none"
    },
    function (error) {
      if (error) throw error;
    }
  );
}
export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export function saveSettings(
  customTitlebarSetting: boolean,
  channelSetting: string,
  armcordCSPSetting: boolean,
  modsSetting: string
) {
  console.log("Setting up ArmCord settings.");
  storage.set(
    "settings",
    {
      customTitlebar: customTitlebarSetting,
      channel: channelSetting,
      firstRun: "done",
      armcordCSP: armcordCSPSetting,
      mods: modsSetting,
    },
    function (error) {
      if (error) throw error;
    }
  );
}
export async function getConfigUnsafe(object: string) {
  const userDataPath = app.getPath("userData");
  const storagePath = userDataPath + "/storage/";
  let rawdata = fs.readFileSync(storagePath + "settings.json", "utf-8");
  let returndata = JSON.parse(rawdata);
  console.log(returndata[object]);
  return returndata[object]
}
export function getVersion() {
  //to-do better way of doing this
  return '3.0.1';
}
 