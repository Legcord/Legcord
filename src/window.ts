// To allow seamless switching between custom titlebar and native os titlebar,
// I had to add most of the window creation code here to split both into seperete functions
// WHY? Because I can't use the same code for both due to annoying bug with value `frame` not responding to variables
// I'm sorry for this mess but I'm not sure how to fix it.
import {BrowserWindow, shell, app, dialog} from "electron";
import path from "path";
import {checkIfConfigIsBroken, firstRun, getConfig, contentPath, isSetup, setConfig, setLang, setWindowState} from "./utils";
import {registerIpc} from "./ipc";
import startServer from "./socket";
import contextMenu from "electron-context-menu";
import os from "os";
export var icon: string;
export let mainWindow: BrowserWindow;
export let inviteWindow: BrowserWindow;
var osType = os.type()

contextMenu({
    showSaveImageAs: true,
    showCopyImageAddress: true,
    showSearchWithGoogle: true
});

async function doAfterDefiningTheWindow() {
    var ignoreProtocolWarning = await getConfig("ignoreProtocolWarning");
    checkIfConfigIsBroken();
    registerIpc();
    
    // A little sloppy but it works :p
    if (osType == 'Windows_NT') {
        osType = "Windows " + os.release().split('.')[0] + " (" + os.release() + ")";
    }
    mainWindow.webContents.userAgent = `Mozilla/5.0 (X11; ${osType} ${os.arch()}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36`; //fake useragent for screenshare to work
    mainWindow.webContents.setWindowOpenHandler(({url}) => {
        if (url.startsWith("https:" || url.startsWith("http:") || url.startsWith("mailto:"))) {
            shell.openExternal(url);
        } else {
            if (ignoreProtocolWarning) {
                shell.openExternal(url);
            } else {
                const options = {
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
                    } else {
                        return;
                    }
                });
            }
        }
        return {action: "deny"};
    });
    mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        if (/api\/v\d\/science$/g.test(details.url)) return callback({cancel: true});
        return callback({});
    });
    mainWindow.on("close", async (e) => {
        let [width, height] = mainWindow.getSize()
        setWindowState({
            width: width,
            height: height,
            isMaximized: mainWindow.isMaximized()
        })
        if (await getConfig("minimizeToTray")) {
            e.preventDefault();
            mainWindow.hide();
        } else if (!(await getConfig("minimizeToTray"))) {
            e.preventDefault();
            app.quit();
        }
    });
    mainWindow.on('maximize',() =>{
        mainWindow.webContents.executeJavaScript(`document.body.setAttribute("isMaximized", "");`)
    })
    mainWindow.on('unmaximize',() =>{
        mainWindow.webContents.executeJavaScript(`document.body.removeAttribute("isMaximized");`)
    })
    console.log(contentPath);
    if ((await getConfig("inviteWebsocket")) == true) {
        startServer();
    }
    try {
        mainWindow.loadFile(contentPath);
        if (isSetup) {
            await setLang(Intl.DateTimeFormat().resolvedOptions().locale)
            mainWindow.setSize(390, 470);
        }
    } catch (e) {
        console.log(
            "Major error detected while starting up. User is most likely on Windows platform. Fallback to alternative startup."
        );
        console.log(process.platform);
        if (process.platform === "win32") {
            if (firstRun) {
                await setLang(Intl.DateTimeFormat().resolvedOptions().locale)
                mainWindow.setSize(390, 470);
                mainWindow.loadURL(`file://${__dirname}/content/setup.html`);
            } else {
                mainWindow.loadURL(`file://${__dirname}/content/splash.html`);
            }
        } else {
            if (firstRun) {
                await setLang(Intl.DateTimeFormat().resolvedOptions().locale)
                mainWindow.setSize(390, 470);
                mainWindow.loadURL(`file://${__dirname}/ts-out/content/setup.html`);
            } else {
                mainWindow.loadURL(`file://${__dirname}/ts-out/content/splash.html`);
            }
        }
    }
}
export function createCustomWindow() {
    mainWindow = new BrowserWindow({
        width: 300,
        height: 350,
        title: "ArmCord",
        darkTheme: true,
        icon: path.join(__dirname, "../", "/assets/ac_icon_transparent.png"),
        frame: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload/preload.js"),
            spellcheck: true
        }
    });
    doAfterDefiningTheWindow();
}
export function createNativeWindow() {
    mainWindow = new BrowserWindow({
        width: 300,
        height: 350,
        title: "ArmCord",
        darkTheme: true,
        icon: path.join(__dirname, "../", "/assets/ac_icon_transparent.png"),
        frame: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload/preload.js"),
            spellcheck: true
        }
    });
    doAfterDefiningTheWindow();
}

export function createInviteWindow() {
    inviteWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: "ArmCord Invite Manager",
        darkTheme: true,
        icon: path.join(__dirname, "../", "/assets/ac_icon_transparent.png"),
        frame: true,
        autoHideMenuBar: true,
        webPreferences: {
            spellcheck: true
        }
    });
    inviteWindow.hide();
}
