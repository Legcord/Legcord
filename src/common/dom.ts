import type { BrowserWindow } from "electron";

let scriptCounter = 0;

export function addStyle(styleUrl: string): void {
    const id = `legcord-style-${styleUrl.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (document.getElementById(id)) return;
    const style = document.createElement("link");
    style.id = id;
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = styleUrl;
    document.head.append(style);
}

export function addTheme(id: string, styleString: string): void {
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.textContent = styleString;
    style.id = id;
    document.head.append(style);
}

export function addScript(scriptString: string): void {
    const id = `legcord-script-${++scriptCounter}`;
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    script.appendChild(document.createTextNode(scriptString));
    document.body.append(script);
}

export async function injectJS(inject: string): Promise<void> {
    const id = `legcord-inject-${inject.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (document.getElementById(id)) return;
    const js = await (await fetch(`${inject}`)).text();
    const el = document.createElement("script");
    el.id = id;
    el.appendChild(document.createTextNode(js));
    document.body.appendChild(el);
}

export function navigateTo(passedWindow: BrowserWindow, url: string): void {
    // Sanitize: only allow path-like URLs (no protocol, no quotes)
    const sanitized = url.replace(/[^a-zA-Z0-9/_\-@.]/g, "");
    console.log(`[legcord deeplink] Navigating to ${sanitized}`);
    passedWindow.webContents.executeJavaScript(
        `history.pushState({}, null, ${JSON.stringify(sanitized)});window.dispatchEvent(new PopStateEvent("popstate", {}));`,
    );
    passedWindow.focus();
}
