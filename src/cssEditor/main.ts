import fs from "node:fs";
import path from "node:path";
import { BrowserWindow, ipcMain } from "electron";

let cssWindow: BrowserWindow | null = null;

export function openCssEditor(file: string) {
    if (cssWindow?.focus) return cssWindow.focus();
    cssWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: `${path.parse(file).base} | CSS Editor`,
        webPreferences: {
            preload: path.join(import.meta.dirname, "cssEditor", "preload.mjs"),
        },
    });
    cssWindow.loadURL("legcord://html/editor.html");

    ipcMain.on("editor-setCSS", (_event, css: string) => {
        fs.writeFileSync(file, css);
    });

    ipcMain.on("editor-getCSS", (event) => {
        event.returnValue = fs.readFileSync(file, "utf-8");
    });
    cssWindow.on("closed", () => {
        ipcMain.removeAllListeners("editor-setCSS");
        ipcMain.removeAllListeners("editor-getCSS");
        cssWindow = null;
    });
}
