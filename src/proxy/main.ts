import path from "node:path";
import { platform } from "node:os";
import { BrowserWindow, type BrowserWindowConstructorOptions, ipcMain } from "electron";
import { getConfig, setConfig } from "../common/config.js";

export let proxyWindow: BrowserWindow;
export async function createProxyWindow(): Promise<void> {
    const windowOptions: BrowserWindowConstructorOptions = {
        width: 800,
        height: 600,
        title: "Legcord Proxy Configuration",
        darkTheme: true,
        icon: getConfig("customIcon") ?? path.join(import.meta.dirname, "../", "/assets/desktop.png"),
        resizable: false,
        frame: true,
        maximizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            sandbox: false,
            spellcheck: false,
            preload: path.join(import.meta.dirname, "proxy", "preload.mjs"),
        },
    };

    if (platform() === "darwin") {
        windowOptions.titleBarStyle = "hidden";
        windowOptions.titleBarOverlay = {
            color: "#2c2f33",
            symbolColor: "#99aab5",
            height: 30,
        };
        windowOptions.trafficLightPosition = {
            x: 13,
            y: 10,
        };
        windowOptions.frame = false;
        windowOptions.vibrancy = "fullscreen-ui";
    }

    proxyWindow = new BrowserWindow(windowOptions);

    ipcMain.on("proxy-config", (event) => {
        event.returnValue = getConfig("proxy");
    });

    ipcMain.on("proxy-save", (_event, proxy) => {
        setConfig("proxy", proxy);
        process.exit(0);
    });

    ipcMain.on("proxy-cancel", () => {
        proxyWindow.close();
    });

    await proxyWindow.loadFile(path.join(import.meta.dirname, "html", "proxy.html"));
}
