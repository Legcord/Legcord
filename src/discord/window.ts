// To allow seamless switching between custom titlebar and native os titlebar,
// I had to add most of the window creation code here to split both into seperete functions
// WHY? Because I can't use the same code for both due to annoying bug with value `frame` not responding to variables
// I'm sorry for this mess but I'm not sure how to fix it.
import {BrowserWindow, MessageBoxOptions, app, dialog, nativeImage, shell} from "electron";
import path from "path";
import {registerIpc} from "./ipc.js";
import {setMenu} from "./menu.js";
import * as fs from "fs";
import contextMenu from "electron-context-menu";
import os from "os";
import RPCServer from "arrpc";
import {tray} from "../tray.js";
import {iconPath} from "../main.js";
import {getConfig, setConfig, firstRun} from "../common/config.js";
import {getWindowState, setWindowState} from "../common/windowState.js";
export let mainWindow: BrowserWindow;
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
                shell.openExternal(`https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}`);
            }
        },
        {
            label: "Search with DuckDuckGo",
            // Only show it when right-clicking text
            visible: parameters.selectionText.trim().length > 0,
            click: () => {
                shell.openExternal(`https://duckduckgo.com/?q=${encodeURIComponent(parameters.selectionText)}`);
            }
        }
    ]
});
async function doAfterDefiningTheWindow(): Promise<void> {
    if ((await getWindowState("isMaximized")) ?? false) {
        mainWindow.setSize(835, 600); //just so the whole thing doesn't cover whole screen
        mainWindow.maximize();
        mainWindow.webContents.executeJavaScript(`document.body.setAttribute("isMaximized", "");`);
        mainWindow.hide(); // please don't flashbang the user
    }
    if ((await getConfig("windowStyle")) == "transparency" && process.platform === "win32") {
        mainWindow.setBackgroundMaterial("mica");
        if ((await getConfig("startMinimized")) == false) {
            mainWindow.show();
        }
    }
    let ignoreProtocolWarning = await getConfig("ignoreProtocolWarning");
    registerIpc();
    if (await getConfig("mobileMode")) {
        mainWindow.webContents.userAgent =
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.149 Mobile Safari/537.36";
    } else {
        // A little sloppy but it works :p
        if (osType == "Windows_NT") {
            osType = `Windows ${os.release().split(".")[0]} (${os.release()})`;
        }
        mainWindow.webContents.userAgent = `Mozilla/5.0 (X11; ${osType} ${os.arch()}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36`; //fake useragent for screenshare to work
    }
    app.on("second-instance", (_event, _commandLine, _workingDirectory, additionalData) => {
        // Print out data received from the second instance.
        console.log(additionalData);

        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
    app.on("activate", function () {
        app.show();
    });
    mainWindow.webContents.setWindowOpenHandler(({url}) => {
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
            shell.openExternal(url);
        } else if (ignoreProtocolWarning) {
            shell.openExternal(url);
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

            dialog.showMessageBox(mainWindow, options).then(({response, checkboxChecked}) => {
                console.log(response, checkboxChecked);
                if (checkboxChecked) {
                    if (response == 0) {
                        setConfig("ignoreProtocolWarning", true);
                    } else {
                        setConfig("ignoreProtocolWarning", false);
                    }
                }
                if (response == 0) {
                    shell.openExternal(url);
                }
            });
        }
        return {action: "deny"};
    });
    if ((await getConfig("useLegacyCapturer")) == false) {
        console.log("Starting screenshare module...");
        import("./screenshare/main.js");
    }

    mainWindow.webContents.session.webRequest.onBeforeRequest(
        {urls: ["https://*/api/v*/science", "https://sentry.io/*", "https://*.nel.cloudflare.com/*"]},
        (_, callback) => callback({cancel: true})
    );

    if ((await getConfig("trayIcon")) == "default" || (await getConfig("dynamicIcon"))) {
        mainWindow.webContents.on("page-favicon-updated", async () => {
            let faviconBase64 = await mainWindow.webContents.executeJavaScript(`
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
            `);
            let buf = Buffer.from(faviconBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
            fs.writeFileSync(path.join(app.getPath("temp"), "/", "tray.png"), buf, "utf-8");
            let trayPath = nativeImage.createFromPath(path.join(app.getPath("temp"), "/", "tray.png"));
            if (process.platform === "darwin" && trayPath.getSize().height > 22)
                trayPath = trayPath.resize({height: 22});
            if (process.platform === "win32" && trayPath.getSize().height > 32)
                trayPath = trayPath.resize({height: 32});
            if (await getConfig("tray")) {
                if ((await getConfig("trayIcon")) == "default") {
                    tray.setImage(trayPath);
                }
            }
            if (await getConfig("dynamicIcon")) {
                mainWindow.setIcon(trayPath);
            }
        });
    }
    mainWindow.webContents.on("page-title-updated", async (e, title) => {
        const armCordSuffix = " - ArmCord"; /* identify */
        if (!title.endsWith(armCordSuffix)) {
            e.preventDefault();
            await mainWindow.webContents.executeJavaScript(
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
    mainWindow.webContents.on("did-finish-load", () => {
        fs.readdirSync(themesFolder).forEach((file) => {
            try {
                const manifest = fs.readFileSync(`${themesFolder}/${file}/manifest.json`, "utf8");
                let themeFile = JSON.parse(manifest);
                if (
                    fs
                        .readFileSync(path.join(userDataPath, "/disabled.txt"))
                        .toString()
                        .includes(themeFile.name.replace(" ", "-"))
                ) {
                    console.log(`%cSkipped ${themeFile.name} made by ${themeFile.author}`, "color:red");
                } else {
                    mainWindow.webContents.send(
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
    await setMenu();
    mainWindow.on("close", async (e) => {
        if (process.platform === "darwin" && forceQuit) {
            mainWindow.close();
        } else {
            let [width, height] = mainWindow.getSize();
            await setWindowState({
                width,
                height,
                isMaximized: mainWindow.isMaximized(),
                x: mainWindow.getPosition()[0],
                y: mainWindow.getPosition()[1]
            });
            if (await getConfig("minimizeToTray")) {
                e.preventDefault();
                mainWindow.hide();
            } else if (!(await getConfig("minimizeToTray"))) {
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
    mainWindow.on("focus", () => {
        mainWindow.webContents.executeJavaScript(`document.body.removeAttribute("unFocused");`);
    });
    mainWindow.on("blur", () => {
        mainWindow.webContents.executeJavaScript(`document.body.setAttribute("unFocused", "");`);
    });

    mainWindow.on("maximize", () => {
        mainWindow.webContents.executeJavaScript(`document.body.setAttribute("isMaximized", "");`);
    });
    mainWindow.on("unmaximize", () => {
        mainWindow.webContents.executeJavaScript(`document.body.removeAttribute("isMaximized");`);
    });
    if ((await getConfig("inviteWebsocket")) == true) {
        const server = await new RPCServer();
        server.on("activity", (data: string) => mainWindow.webContents.send("rpc", data));
        server.on("invite", (code: string) => {
            console.log(code);
            createInviteWindow(code);
        });
    }
    if (firstRun) {
        mainWindow.close();
    }
    //loadURL broke for no good reason after E28
    mainWindow.loadFile(`${import.meta.dirname}/../splash/redirect.html`);

    if (await getConfig("skipSplash")) {
        mainWindow.show();
    }
}
export async function createCustomWindow(): Promise<void> {
    mainWindow = new BrowserWindow({
        width: (await getWindowState("width")) ?? 835,
        height: (await getWindowState("height")) ?? 600,
        x: await getWindowState("x"),
        y: await getWindowState("y"),
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
            spellcheck: await getConfig("spellcheck")
        }
    });
    doAfterDefiningTheWindow();
}
export async function createNativeWindow(): Promise<void> {
    mainWindow = new BrowserWindow({
        width: (await getWindowState("width")) ?? 835,
        height: (await getWindowState("height")) ?? 600,
        x: await getWindowState("x"),
        y: await getWindowState("y"),
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
            spellcheck: await getConfig("spellcheck")
        }
    });
    doAfterDefiningTheWindow();
}
export async function createTransparentWindow(): Promise<void> {
    mainWindow = new BrowserWindow({
        width: (await getWindowState("width")) ?? 835,
        height: (await getWindowState("height")) ?? 600,
        x: await getWindowState("x"),
        y: await getWindowState("y"),
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
            spellcheck: await getConfig("spellcheck")
        }
    });
    doAfterDefiningTheWindow();
}
export async function createInviteWindow(code: string): Promise<void> {
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
            spellcheck: await getConfig("spellcheck")
        }
    });
    let formInviteURL = `https://discord.com/invite/${code}`;
    inviteWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        if (details.url.includes("ws://")) return callback({cancel: true});
        return callback({});
    });
    inviteWindow.loadURL(formInviteURL);
    inviteWindow.webContents.once("did-finish-load", () => {
        if (!mainWindow.webContents.isLoading()) {
            inviteWindow.show();
            inviteWindow.webContents.once("will-navigate", () => {
                inviteWindow.close();
            });
        }
    });
}
