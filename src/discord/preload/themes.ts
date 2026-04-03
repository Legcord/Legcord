import { addTheme } from "../../common/dom.js";
const { ipcRenderer } = require("electron");

ipcRenderer.on("addTheme", (_event: unknown, name: string, css: string) => {
    if (document.getElementById(name)) return;
    addTheme(name, css);
});
ipcRenderer.on("removeTheme", (_event: unknown, name: string) => {
    document.getElementById(name)!.remove();
});
