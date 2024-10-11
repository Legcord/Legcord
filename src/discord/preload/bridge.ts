import { type SourcesOptions, contextBridge, ipcRenderer } from "electron";
import type { Keybind } from "../../@types/keybind.js";
import type { LegcordWindow } from "../../@types/legcordWindow.d.ts";
import type { Settings } from "../../@types/settings.js";

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
contextBridge.exposeInMainWorld("legcord", {
    window: {
        show: () => ipcRenderer.send("win-show"),
        hide: () => ipcRenderer.send("win-hide"),
        minimize: () => ipcRenderer.send("win-minimize"),
        maximize: () => ipcRenderer.send("win-maximize"),
    },
    settings: {
        getConfig: () => ipcRenderer.sendSync("getEntireConfig") as Settings,
        setConfig: (key: string, value: string) => ipcRenderer.send("setConfig", key, value),
        addKeybind: (keybind: Keybind) => ipcRenderer.send("addKeybind", keybind),
        toggleKeybind: (id: string) => ipcRenderer.send("toggleKeybind", id),
        removeKeybind: (id: string) => ipcRenderer.send("removeKeybind", id),
        openStorageFolder: () => ipcRenderer.send("openStorageFolder"),
        setLang: (lang: string) => ipcRenderer.send("setLang", lang),
        openThemesFolder: () => ipcRenderer.send("openThemesFolder"),
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
    platform: ipcRenderer.sendSync("getOS") as string,
    restart: () => ipcRenderer.send("restart"),
    openThemesWindow: () => ipcRenderer.send("openThemesWindow"),
    openQuickCssFile: () => ipcRenderer.send("openQuickCssFile"),
} as LegcordWindow);

let windowCallback: (arg0: object) => void;
contextBridge.exposeInMainWorld("LegcordRPC", {
    // REVIEW - I don't think this is right
    listen: (callback: () => void) => {
        windowCallback = callback;
    },
});
ipcRenderer.on("rpc", (_event, data: object) => {
    console.log(data);
    windowCallback(data);
});
