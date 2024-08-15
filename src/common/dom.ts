export function addStyle(styleString: string): void {
    const style = document.createElement("style");
    style.textContent = styleString;
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
    script.textContent = scriptString;
    document.body.append(script);
}
export async function injectJS(inject: string): Promise<void> {
    const js = await (await fetch(`${inject}`)).text();

    const el = document.createElement("script");

    el.appendChild(document.createTextNode(js));

    document.body.appendChild(el);
}
