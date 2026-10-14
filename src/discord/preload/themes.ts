import { addTheme, removeTheme } from "../../common/dom.js";

const { ipcRenderer } = require("electron");

ipcRenderer.on("addTheme", (_event: unknown, name: string, css: string) => {
    if (typeof name !== "string" || typeof css !== "string") return;
    addTheme(name, css);
});

ipcRenderer.on("removeTheme", (_event: unknown, name: string) => {
    if (typeof name !== "string") return;
    removeTheme(name);
});
