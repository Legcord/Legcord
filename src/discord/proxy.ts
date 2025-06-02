import type { BrowserWindow } from "electron";
import { getConfig } from "../common/config.js";

export function setupProxyListener(passedWindow: BrowserWindow): void {
    const timeout = setTimeout(() => {
        const currentUrl = passedWindow.webContents.getURL();
        if (currentUrl.endsWith("/app")) {
            void passedWindow.webContents.executeJavaScript(`
                const button = document.createElement('button');
                button.innerText = 'Configure Proxy';
                button.id = 'proxyModalButton';
                button.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; padding: 10px 20px; background: #5865F2; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;';
                button.onclick = () => {
                    window.electron.ipcRenderer.send('openProxyModal');
                };
                document.body.appendChild(button);
            `);
        }
    }, 10000);

    const clearTimeoutListener = () => {
        const currentUrl = passedWindow.webContents.getURL();
        if (!currentUrl.endsWith("/app")) {
            clearTimeout(timeout);
            passedWindow.webContents.removeListener("did-navigate", clearTimeoutListener);
            passedWindow.webContents.removeListener("did-navigate-in-page", clearTimeoutListener);
            // Remove the button if it exists
            void passedWindow.webContents.executeJavaScript(`
                const proxyButton = document.querySelector('#proxyModalButton');
                if (proxyButton) proxyButton.remove();
            `);
        }
    };
    passedWindow.webContents.addListener("did-navigate", clearTimeoutListener);
    passedWindow.webContents.addListener("did-navigate-in-page", clearTimeoutListener);
}

const proxyRegex = /^(https?|socks5?|socks4):\/\/(?:\S+:\S+@)?(?:\d{1,3}\.){3}\d{1,3}:\d{2,5}$/i;

export function isValidProxyURL(proxyURL: string): boolean {
    return proxyRegex.test(proxyURL);
}

export function setupWindowProxy(passedWindow: BrowserWindow): void {
    const proxyURL = getConfig("proxy");
    console.log(proxyURL);
    if (typeof proxyURL === "string" && isValidProxyURL(proxyURL)) {
        console.log("setting proxy");
        passedWindow.webContents.session.setProxy({
            proxyRules: proxyURL,
        });
    }
}
