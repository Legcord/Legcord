// To allow seamless switching between custom titlebar and native os titlebar,
// I had to add most of the window creation code here to split both into separate functions
// WHY? Because I can't use the same code for both due to annoying bug with value `frame` not responding to variables
// I'm sorry for this mess but I'm not sure how to fix it.
import {BrowserWindow, MessageBoxOptions, app, dialog, nativeImage, shell} from "electron";
import path from "path";
import type EventEmitter from "events";
import {ThemeManifest} from "../types/themeManifest.d.js";
import {registerIpc} from "./ipc.js";
import {setMenu} from "./menu.js";
import * as fs from "fs";
import contextMenu from "electron-context-menu";
import os from "os";
import RPCServer from "arrpc";
import {tray} from "../tray.js";
import {iconPath, init} from "../main.js";
import {getConfig, setConfig, firstRun} from "../common/config.js";
import {getWindowState, setWindowState} from "../common/windowState.js";
export let mainWindows: BrowserWindow[] = [];
export let inviteWindow: BrowserWindow;
let forceQuit = false;
let osType = os.type();
contextMenu({
    showSaveImageAs: true,
    showCopyImageAddress: true,
    showSearchWithGoogle: false,
    prepend: (_defaultActions, parameters) => [
        {
            label: "Search with Google",
            // Only show it when right-clicking text
            visible: parameters.selectionText.trim().length > 0,
            click: () => {
                void shell.openExternal(`https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}`);
            }
        },
        {
            label: "Search with DuckDuckGo",
            // Only show it when right-clicking text
            visible: parameters.selectionText.trim().length > 0,
            click: () => {
                void shell.openExternal(`https://duckduckgo.com/?q=${encodeURIComponent(parameters.selectionText)}`);
            }
        }
    ]
});
function doAfterDefiningTheWindow(passedWindow: BrowserWindow): void {
    if (getWindowState("isMaximized") ?? false) {
        passedWindow.setSize(835, 600); //just so the whole thing doesn't cover whole screen
        passedWindow.maximize();
        void passedWindow.webContents.executeJavaScript(`document.body.setAttribute("isMaximized", "");`);
        passedWindow.hide(); // please don't flashbang the user
    }
    if (getConfig("windowStyle") == "transparency" && process.platform === "win32") {
        passedWindow.setBackgroundMaterial("mica");
        if (getConfig("startMinimized") == false) {
            passedWindow.show();
        }
    }

    // REVIEW - Test the protocol warning. I was not sure how to get it to pop up. For now I've voided the promises.

    const ignoreProtocolWarning = getConfig("ignoreProtocolWarning");
    registerIpc(passedWindow);
    if (getConfig("mobileMode")) {
        passedWindow.webContents.userAgent =
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.149 Mobile Safari/537.36";
    } else {
        // A little sloppy but it works :p
        if (osType == "Windows_NT") {
            osType = `Windows ${os.release().split(".")[0]} (${os.release()})`;
        }
        passedWindow.webContents.userAgent = `Mozilla/5.0 (X11; ${osType} ${os.arch()}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36`; //fake useragent for screenshare to work
    }
    if (mainWindows.length === 1) {
        app.on("second-instance", async (_event, _commandLine, _workingDirectory, additionalData) => {
            // Print out data received from the second instance.
            console.log(additionalData);

            if (getConfig("multiInstance") == (false ?? undefined)) {
                // Someone tried to run a second instance, we should focus our window.
                if (passedWindow) {
                    if (passedWindow.isMinimized()) passedWindow.restore();
                    passedWindow.show();
                    passedWindow.focus();
                }
            } else {
                await init();
            }
        });
    }
    app.on("activate", function () {
        app.show();
    });
    passedWindow.webContents.setWindowOpenHandler(({url}) => {
        // Allow about:blank (used by Vencord QuickCss popup)
        if (url === "about:blank") return {action: "allow"};
        // Allow Discord stream popout
        if (
            url === "https://discord.com/popout" ||
            url === "https://canary.discord.com/popout" ||
            url === "https://ptb.discord.com/popout"
        )
            return {
                action: "allow",
                overrideBrowserWindowOptions: {
                    alwaysOnTop: true
                }
            };
        if (url.startsWith("https:") || url.startsWith("http:") || url.startsWith("mailto:")) {
            void shell.openExternal(url);
        } else if (ignoreProtocolWarning) {
            void shell.openExternal(url);
        } else {
            const options: MessageBoxOptions = {
                type: "question",
                buttons: ["Yes, please", "No, I don't"],
                defaultId: 1,
                title: url,
                message: `Do you want to open ${url}?`,
                detail: "This url was detected to not use normal browser protocols. It could mean that this url leads to a local program on your computer. Please check if you recognise it, before proceeding!",
                checkboxLabel: "Remember my answer and ignore this warning for future sessions",
                checkboxChecked: false
            };

            void dialog.showMessageBox(passedWindow, options).then(({response, checkboxChecked}) => {
                console.log(response, checkboxChecked);
                if (checkboxChecked) {
                    if (response == 0) {
                        setConfig("ignoreProtocolWarning", true);
                    } else {
                        setConfig("ignoreProtocolWarning", false);
                    }
                }
                if (response == 0) {
                    void shell.openExternal(url);
                }
            });
        }
        return {action: "deny"};
    });
    if (getConfig("useLegacyCapturer") == false) {
        console.log("Starting screenshare module...");
        import("./screenshare/main.js");
    }

    passedWindow.webContents.session.webRequest.onBeforeRequest(
        {urls: ["https://*/api/v*/science", "https://sentry.io/*", "https://*.nel.cloudflare.com/*"]},
        (_, callback) => callback({cancel: true})
    );

    if (getConfig("trayIcon") == "default" || getConfig("dynamicIcon")) {
        passedWindow.webContents.on("page-favicon-updated", () => {
            // REVIEW - no need to await if we just .then() - This works!
            void passedWindow.webContents
                .executeJavaScript(
                    `
                var getFavicon = function(){
                var favicon = undefined;
                var nodeList = document.getElementsByTagName("link");
                for (var i = 0; i < nodeList.length; i++)
                {
                    if((nodeList[i].getAttribute("rel") == "icon")||(nodeList[i].getAttribute("rel") == "shortcut icon"))
                    {
                        favicon = nodeList[i].getAttribute("href");
                    }
                }
                return favicon;
                }
                getFavicon()
            `
                )
                .then((faviconBase64: string) => {
                    const buf = Buffer.from(faviconBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
                    fs.writeFileSync(path.join(app.getPath("temp"), "/", "tray.png"), buf, "utf-8");
                    let trayPath = nativeImage.createFromPath(path.join(app.getPath("temp"), "/", "tray.png"));
                    if (process.platform === "darwin" && trayPath.getSize().height > 22)
                        trayPath = trayPath.resize({height: 22});
                    if (process.platform === "win32" && trayPath.getSize().height > 32)
                        trayPath = trayPath.resize({height: 32});
                    if (getConfig("tray")) {
                        if (getConfig("trayIcon") == "default") {
                            tray.setImage(trayPath);
                        }
                    }
                    if (getConfig("dynamicIcon")) {
                        passedWindow.setIcon(trayPath);
                    }
                });
        });
    }
    passedWindow.webContents.on("page-title-updated", (e, title) => {
        const armCordSuffix = " - ArmCord"; /* identify */
        if (!title.endsWith(armCordSuffix)) {
            e.preventDefault();
            // REVIEW - I don't see a reason to wait for the titlebar to update
            void passedWindow.webContents.executeJavaScript(
                `document.title = '${title.replace("Discord |", "") + armCordSuffix}'`
            );
        }
    });
    const userDataPath = app.getPath("userData");
    const themesFolder = `${userDataPath}/themes/`;
    if (!fs.existsSync(themesFolder)) {
        fs.mkdirSync(themesFolder);
        console.log("Created missing theme folder");
    }
    if (!fs.existsSync(`${userDataPath}/disabled.txt`)) {
        fs.writeFileSync(path.join(userDataPath, "/disabled.txt"), "");
    }
    passedWindow.webContents.on("did-finish-load", () => {
        fs.readdirSync(themesFolder).forEach((file) => {
            try {
                const manifest = fs.readFileSync(`${themesFolder}/${file}/manifest.json`, "utf8");
                const themeFile = JSON.parse(manifest) as ThemeManifest;
                if (
                    fs
                        .readFileSync(path.join(userDataPath, "/disabled.txt"))
                        .toString()
                        .includes(themeFile.name.replace(" ", "-"))
                ) {
                    console.log(`%cSkipped ${themeFile.name} made by ${themeFile.author}`, "color:red");
                } else {
                    passedWindow.webContents.send(
                        "themeLoader",
                        fs.readFileSync(`${themesFolder}/${file}/${themeFile.theme}`, "utf-8")
                    );
                    console.log(`%cLoaded ${themeFile.name} made by ${themeFile.author}`, "color:red");
                }
            } catch (err) {
                console.error(err);
            }
        });
    });
    setMenu();
    passedWindow.on("close", (e) => {
        if (process.platform === "darwin" && forceQuit) {
            passedWindow.close();
        } else if (mainWindows.length > 1) {
            mainWindows = mainWindows.filter((mainWindow) => mainWindow.id != passedWindow.id);
            passedWindow.destroy();
        } else {
            const [width, height] = passedWindow.getSize();
            setWindowState({
                width,
                height,
                isMaximized: passedWindow.isMaximized(),
                x: passedWindow.getPosition()[0],
                y: passedWindow.getPosition()[1]
            });
            if (getConfig("minimizeToTray")) {
                e.preventDefault();
                passedWindow.hide();
            } else if (!getConfig("minimizeToTray")) {
                e.preventDefault();
                app.quit();
            }
        }
    });
    if (process.platform === "darwin") {
        app.on("before-quit", function (event) {
            if (!forceQuit) {
                event.preventDefault();
                forceQuit = true;
                app.quit();
            }
        });
    }

    // REVIEW - Awaiting javascript execution is silly
    passedWindow.on("focus", () => {
        void passedWindow.webContents.executeJavaScript(`document.body.removeAttribute("unFocused");`);
    });
    passedWindow.on("blur", () => {
        void passedWindow.webContents.executeJavaScript(`document.body.setAttribute("unFocused", "");`);
    });

    passedWindow.on("maximize", () => {
        void passedWindow.webContents.executeJavaScript(`document.body.setAttribute("isMaximized", "");`);
    });
    passedWindow.on("unmaximize", () => {
        void passedWindow.webContents.executeJavaScript(`document.body.removeAttribute("isMaximized");`);
    });
    if (getConfig("inviteWebsocket") && mainWindows.length === 1) {
        // NOTE - RPCServer appears to be untyped. cool.
        // REVIEW - Whatever Ducko has done here to make an async constructor is awful.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        new RPCServer().then((server: EventEmitter) => {
            server.on("activity", (data: string) => passedWindow.webContents.send("rpc", data));
            server.on("invite", (code: string) => {
                console.log(code);
                createInviteWindow(code);
            });
        });
    }
    if (firstRun) {
        passedWindow.close();
    }
    //loadURL broke for no good reason after E28
    void passedWindow.loadFile(`${import.meta.dirname}/../splash/redirect.html`);

    if (getConfig("skipSplash")) {
        passedWindow.show();
    }
}
export function createCustomWindow(): void {
    let mainWindow = new BrowserWindow({
        width: getWindowState("width") ?? 835,
        height: getWindowState("height") ?? 600,
        x: getWindowState("x"),
        y: getWindowState("y"),
        title: "ArmCord",
        show: false,
        darkTheme: true,
        icon: iconPath,
        frame: false,
        backgroundColor: "#202225",
        autoHideMenuBar: true,
        webPreferences: {
            webviewTag: true,
            sandbox: false,
            preload: path.join(import.meta.dirname, "preload/preload.mjs"),
            spellcheck: getConfig("spellcheck")
        }
    });
    mainWindows.push(mainWindow);
    doAfterDefiningTheWindow(mainWindow);
}
export function createNativeWindow(): void {
    let mainWindow = new BrowserWindow({
        width: getWindowState("width") ?? 835,
        height: getWindowState("height") ?? 600,
        x: getWindowState("x"),
        y: getWindowState("y"),
        title: "ArmCord",
        darkTheme: true,
        icon: iconPath,
        show: false,
        frame: true,
        backgroundColor: "#202225",
        autoHideMenuBar: true,
        webPreferences: {
            webviewTag: true,
            sandbox: false,
            preload: path.join(import.meta.dirname, "preload/preload.mjs"),
            spellcheck: getConfig("spellcheck")
        }
    });
    mainWindows.push(mainWindow);
    doAfterDefiningTheWindow(mainWindow);
}
export function createTransparentWindow(): void {
    let mainWindow = new BrowserWindow({
        width: getWindowState("width") ?? 835,
        height: getWindowState("height") ?? 600,
        x: getWindowState("x"),
        y: getWindowState("y"),
        title: "ArmCord",
        darkTheme: true,
        icon: iconPath,
        frame: true,
        backgroundColor: "#00000000",
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            sandbox: false,
            webviewTag: true,
            preload: path.join(import.meta.dirname, "preload/preload.mjs"),
            spellcheck: getConfig("spellcheck")
        }
    });
    mainWindows.push(mainWindow);
    doAfterDefiningTheWindow(mainWindow);
}
export function createInviteWindow(code: string): void {
    inviteWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: "ArmCord Invite Manager",
        darkTheme: true,
        icon: iconPath,
        frame: true,
        autoHideMenuBar: true,
        webPreferences: {
            sandbox: false,
            spellcheck: getConfig("spellcheck")
        }
    });
    const formInviteURL = `https://discord.com/invite/${code}`;
    inviteWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        if (details.url.includes("ws://")) return callback({cancel: true});
        return callback({});
    });
    // REVIEW - This shouldn't matter, since below we have an event on it
    void inviteWindow.loadURL(formInviteURL);
    inviteWindow.webContents.once("did-finish-load", () => {
        if (!mainWindows[0].webContents.isLoading()) {
            inviteWindow.show();
            inviteWindow.webContents.once("will-navigate", () => {
                inviteWindow.close();
            });
        }
    });
}
