// To allow seamless switching between custom titlebar and native os titlebar,
// I had to add most of the window creation code here to split both into seperete functions
// WHY? Because I can't use the same code for both due to annoying bug with value `frame` not responding to variables
// I'm sorry for this mess but I'm not sure how to fix it.
import {BrowserWindow, shell, app, ipcMain, dialog} from "electron";
import path from "path";
import {checkIfConfigIsBroken, firstRun, getConfig, contentPath} from "./utils";
import {registerIpc} from "./ipc";
import startServer from "./socket"
import contextMenu from "electron-context-menu";
export var icon: string;
export let mainWindow: BrowserWindow;
export let inviteWindow: BrowserWindow;
let guestWindows: BrowserWindow[] = [];
contextMenu({
    showSaveImageAs: true,
    showCopyImageAddress: true,
    showSearchWithGoogle: true
});

async function doAfterDefiningTheWindow() {
    checkIfConfigIsBroken();
    registerIpc();
    mainWindow.webContents.userAgent =
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"; //fake useragent for screenshare to work
    mainWindow.webContents.setWindowOpenHandler(({url}) => {
        shell.openExternal(url);
        return {action: "deny"};
    });
    mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        if (/api\/v\d\/science$/g.test(details.url)) return callback({cancel: true});
        return callback({});
    });
    mainWindow.on("close", async (e) => {
        if (await getConfig("minimizeToTray")) {
            e.preventDefault();
            mainWindow.hide();
        } else if (!(await getConfig("minimizeToTray"))) {
            e.preventDefault();
            app.quit();
        }
    });
    console.log(contentPath);
    if (await getConfig("inviteWebsocket") == true) {
        startServer()
    }
    try {
        mainWindow.loadFile(contentPath);
    } catch (e) {
        console.log(
            "Major error detected while starting up. User is most likely on Windows platform. Fallback to alternative startup."
        );
        console.log(process.platform);
        if (process.platform === "win32") {
            if (firstRun) {
                mainWindow.loadURL(`file://${__dirname}/content/setup.html`);
            } else {
                mainWindow.loadURL(`file://${__dirname}/content/splash.html`);
            }
        } else {
            if (firstRun) {
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
        icon: path.join(__dirname, "/assets/icon_transparent.png"),
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
        icon: path.join(__dirname, "/assets/icon_transparent.png"),
        frame: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload/preload.js"),
            spellcheck: true
        }
    });
    doAfterDefiningTheWindow();
}

export function createTabsHost() {
    dialog.showErrorBox(
        "READ THIS BEFORE USING THE APP",
        "ArmCord Tabs are highly experimental and should be only used for strict testing purposes. Please don't ask for support, however you can still report bugs!"
    );
    guestWindows[1] = mainWindow;
    mainWindow = new BrowserWindow({
        width: 300,
        height: 350,
        title: "ArmCord",
        darkTheme: true,
        icon: path.join(__dirname, "/assets/icon_transparent.png"),
        frame: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload/preload.js")
        }
    });
    doAfterDefiningTheWindow();
}
export function createTabsGuest(number: number) {
    console.log(guestWindows);
    if (guestWindows[number] !== undefined || null) {
        try {
            console.log("Showing Guest Window " + number);
            mainWindow.hide();
            guestWindows[number].show();
            mainWindow = guestWindows[number];
        } catch (e) {
            console.error(e);
        }
    } else {
        console.log("Creating Guest Window " + number);
        mainWindow.hide();

        guestWindows[number] = new BrowserWindow({
            width: 800,
            height: 600,
            title: "ArmCord Guest Window " + number,
            darkTheme: true,
            icon: path.join(__dirname, "/assets/icon_transparent.png"),
            frame: true,
            autoHideMenuBar: true,
            webPreferences: {
                preload: path.join(__dirname, "preload/preload.js")
            }
        });

        mainWindow = guestWindows[number];
        ipcMain.on("tab" + number, (event) => {
            event.returnValue = true; //return true so we know the tab exists
        });

        guestWindows[number].webContents.userAgent =
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"; //fake useragent for screenshare to work

        guestWindows[number].webContents.setWindowOpenHandler(({url}) => {
            shell.openExternal(url);
            return {action: "deny"};
        });

        guestWindows[number].webContents.session.webRequest.onBeforeRequest(
            (details: {url: string}, callback: (arg0: {cancel?: boolean}) => any) => {
                if (/api\/v\d\/science$/g.test(details.url)) return callback({cancel: true});
                return callback({});
            }
        );

        guestWindows[number].loadURL("https://discord.com/app");
    }
}
export function createInviteWindow() {
    inviteWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: "ArmCord Invite Manager",
        darkTheme: true,
        icon: path.join(__dirname, "/assets/icon_transparent.png"),
        frame: true,
        autoHideMenuBar: true,
        webPreferences: {
            spellcheck: true
        }
    });
    inviteWindow.hide()
}