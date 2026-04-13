import type { BrowserWindow } from "electron";

export function addStyle(styleUrl: string): void {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = styleUrl;
    document.head.append(style);
}

export function addTheme(id: string, styleString: string): void {
    const style = document.createElement("style");
    style.textContent = styleString;
    style.id = id;
    document.head.append(style);
}

export function addScript(scriptString: string): void {
    const script = document.createElement("script");
    script.appendChild(document.createTextNode(scriptString));
    document.body.append(script);
}

export async function injectJS(inject: string): Promise<void> {
    const js = await (await fetch(`${inject}`)).text();

    const el = document.createElement("script");

    el.appendChild(document.createTextNode(js));

    document.body.appendChild(el);
}

export function navigateTo(passedWindow: BrowserWindow, url: string): void {
    console.log(`[legcord deeplink] Navigating to ${url}`);
    const safeUrl = JSON.stringify(url);
    passedWindow.webContents.executeJavaScript(`
        history.pushState({}, null, ${safeUrl});
        window.dispatchEvent(new PopStateEvent("popstate", {}));
    `);
    passedWindow.focus();
}
