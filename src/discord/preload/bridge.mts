import {contextBridge, ipcRenderer} from "electron";
import {injectTitlebar} from "./titlebar.js";
const CANCEL_ID = "desktop-capturer-selection__cancel";
const desktopCapturer = {
    getSources: (opts: any) => ipcRenderer.invoke("DESKTOP_CAPTURER_GET_SOURCES", opts)
};
interface IPCSources {
    id: string;
    name: string;
    thumbnail: HTMLCanvasElement;
}
async function getDisplayMediaSelector(): Promise<string> {
    const sources: IPCSources[] = await desktopCapturer.getSources({
        types: ["screen", "window"]
    });
    return `<div class="desktop-capturer-selection__scroller">
  <ul class="desktop-capturer-selection__list">
    ${sources
        .map(
            ({id, name, thumbnail}) => `
      <li class="desktop-capturer-selection__item">
        <button class="desktop-capturer-selection__btn" data-id="${id}" title="${name}">
          <img class="desktop-capturer-selection__thumbnail" src="${thumbnail.toDataURL()}" />
          <span class="desktop-capturer-selection__name">${name}</span>
        </button>
      </li>
    `
        )
        .join("")}
    <li class="desktop-capturer-selection__item">
      <button class="desktop-capturer-selection__btn" data-id="${CANCEL_ID}" title="Cancel">
        <span class="desktop-capturer-selection__name desktop-capturer-selection__name--cancel">Cancel</span>
      </button>
    </li>
  </ul>
</div>`;
}
contextBridge.exposeInMainWorld("armcord", {
    window: {
        show: () => ipcRenderer.send("win-show"),
        hide: () => ipcRenderer.send("win-hide"),
        minimize: () => ipcRenderer.send("win-minimize"),
        maximize: () => ipcRenderer.send("win-maximize")
    },
    titlebar: {
        injectTitlebar: () => injectTitlebar(),
        isTitlebar: ipcRenderer.sendSync("titlebar")
    },
    electron: process.versions.electron,
    channel: ipcRenderer.sendSync("channel"),
    setPingCount: (pingCount: number) => ipcRenderer.send("setPing", pingCount),
    setTrayIcon: (favicon: string) => ipcRenderer.send("sendTrayIcon", favicon),
    getLang: (toGet: string) =>
        ipcRenderer.invoke("getLang", toGet).then((result) => {
            return result;
        }),
    getDisplayMediaSelector,
    version: ipcRenderer.sendSync("get-app-version", "app-version"),
    mods: ipcRenderer.sendSync("clientmod"),
    openSettingsWindow: () => ipcRenderer.send("openSettingsWindow")
});
let windowCallback: (arg0: object) => void;
contextBridge.exposeInMainWorld("ArmCordRPC", {
    listen: (callback: any) => {
        windowCallback = callback;
    }
});
ipcRenderer.on("rpc", (_event, data: object) => {
    console.log(data);
    windowCallback(data);
});
