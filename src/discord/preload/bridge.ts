import { type SourcesOptions, contextBridge, ipcRenderer } from "electron";
import type { ArmCordWindow } from "../../@types/armcordWindow.js";

const CANCEL_ID = "desktop-capturer-selection__cancel";
const desktopCapturer = {
    getSources: (opts: SourcesOptions) => ipcRenderer.invoke("DESKTOP_CAPTURER_GET_SOURCES", opts),
};
interface IPCSources {
    id: string;
    name: string;
    thumbnail: HTMLCanvasElement;
}
async function getDisplayMediaSelector(): Promise<string> {
    const sources = (await desktopCapturer.getSources({
        types: ["screen", "window"],
    })) as IPCSources[];
    return `<div class="desktop-capturer-selection__scroller">
  <ul class="desktop-capturer-selection__list">
    ${sources
        .map(
            ({ id, name, thumbnail }) => `
      <li class="desktop-capturer-selection__item">
        <button class="desktop-capturer-selection__btn" data-id="${id}" title="${name}">
          <img class="desktop-capturer-selection__thumbnail" src="${thumbnail.toDataURL()}" />
          <span class="desktop-capturer-selection__name">${name}</span>
        </button>
      </li>
    `,
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
        maximize: () => ipcRenderer.send("win-maximize"),
    },
    settings: {
        config: ipcRenderer.sendSync("getEntireConfig") as string,
        setConfig: (key: string, value: string) => ipcRenderer.send("setConfig", key, value),
        openStorageFolder: () => ipcRenderer.send("openStorageFolder"),
        copyDebugInfo: () => ipcRenderer.send("copyDebugInfo"),
        copyGPUInfo: () => ipcRenderer.send("copyGPUInfo"),
    },
    electron: process.versions.electron,
    setTrayIcon: (favicon: string) => ipcRenderer.send("sendTrayIcon", favicon),
    translations: ipcRenderer.sendSync("getTranslations") as string,
    getLang: async (toGet: string) =>
        await ipcRenderer.invoke("getLang", toGet).then((result) => {
            return result as string;
        }),
    getDisplayMediaSelector,
    version: ipcRenderer.sendSync("get-app-version", "app-version") as string,
    restart: () => ipcRenderer.send("restart"),
    openThemesWindow: () => ipcRenderer.send("openThemesWindow"),
    openQuickCssFile: () => ipcRenderer.send("openQuickCssFile"),
} as ArmCordWindow);
let windowCallback: (arg0: object) => void;
contextBridge.exposeInMainWorld("ArmCordRPC", {
    // REVIEW - I don't think this is right
    listen: (callback: () => void) => {
        windowCallback = callback;
    },
});
ipcRenderer.on("rpc", (_event, data: object) => {
    console.log(data);
    windowCallback(data);
});
