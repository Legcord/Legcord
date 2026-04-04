/// <reference path="../../../node_modules/@uwu/shelter-defs/dist/shelter-defs/rootdefs.d.ts" />
const {
    util: { log },
    flux: { dispatcher },
} = shelter;
const titlebarOverlayHTML = `<nav class="titlebar">
          <div class="window-title" id="window-title"></div>
        </nav>`;

const titlebarNavControls = `
          <div id="window-controls-container">
              <div id="spacer"></div>
              <div id="minimize"><div id="minimize-icon"></div></div>
              <div id="maximize"><div id="maximize-icon"></div></div>
              <div id="quit"><div id="quit-icon"></div></div>
          </div>
`;

const settings = window.legcord.settings.getConfig();

function injectButtonControls() {
    const elem = document.createElement("div");
    elem.innerHTML = titlebarNavControls;
    elem.id = "legcordNavControls";
    document.body.append(elem);
    const minimize = document.getElementById("minimize");
    const maximize = document.getElementById("maximize");
    const quit = document.getElementById("quit");

    minimize!.addEventListener("click", () => {
        window.legcord.window.minimize();
    });

    maximize!.addEventListener("click", () => {
        if (window.legcord.window.maximized() === true) {
            window.legcord.window.unmaximize();
            document.body.removeAttribute("isMaximized");
        } else if (window.legcord.window.isNormal() === true) {
            window.legcord.window.maximize();
        }
    });
    const minimizeToTray = settings.minimizeToTray;
    quit!.addEventListener("click", () => {
        if (minimizeToTray === true) {
            window.legcord.window.hide();
        } else if (minimizeToTray === false) {
            window.legcord.window.quit();
        }
    });
}

function layerPush(payload: { type: string; component: string }) {
    console.log(payload.component);
    if (payload.component === "USER_SETTINGS") {
        const elem = document.createElement("div");
        elem.innerHTML = titlebarOverlayHTML;
        elem.id = "legcordTitlebar";
        document.body.prepend(elem);
    }
}

function layerPop() {
    console.log("pop!");
    document.getElementById("legcordTitlebar")?.remove();
}

export function onLoad() {
    log("Legcord Titlebar Controller");
    switch (settings.windowStyle) {
        case "default":
            document.body.setAttribute("customTitlebar", "");
            injectButtonControls();
            break;
        case "overlay":
            document.body.setAttribute("customTitlebar", "");
            dispatcher.subscribe("LAYER_PUSH", layerPush);
            dispatcher.subscribe("LAYER_POP", layerPop);
            break;
        default:
            log("Unsupported window style");
    }
}

export function onUnload() {
    dispatcher.unsubscribe("LAYER_PUSH", layerPush);
    dispatcher.unsubscribe("LAYER_POP", layerPop);
}
