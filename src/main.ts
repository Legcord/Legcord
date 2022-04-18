// Modules to control application life and create native browser window
import {app, BrowserWindow, session, dialog} from "electron";
import * as path from "path";
import "v8-compile-cache";
import * as storage from "electron-json-storage";
import {getConfigUnsafe, setup} from "./utils";
import "./extensions/mods";
import "./extensions/plugin";
import "./tray";
import {mainWindow, createCustomWindow, createNativeWindow, createTabsHost} from "./window";
import "./shortcuts";
export var contentPath: string;
var channel: string;
export var settings: any;
export var customTitlebar: boolean;
export var tabs: boolean;
async function appendSwitch() {
    if ((await getConfigUnsafe("windowStyle")) == "glasstron") {
        console.log("Enabling transparency visuals.");
        app.commandLine.appendSwitch("enable-transparent-visuals");
    }
}
appendSwitch();
storage.has("settings", function (error, hasKey) {
    if (error) throw error;

    if (!hasKey) {
        console.log("First run of the ArmCord. Starting setup.");
        setup();
        contentPath = path.join(__dirname, "/content/setup.html");
        if (!contentPath.includes("ts-out")) {
            contentPath = path.join(__dirname, "/ts-out/content/setup.html");
        }
    } else {
        console.log("ArmCord has been run before. Skipping setup.");
        contentPath = path.join(__dirname, "/content/splash.html");
        if (!contentPath.includes("ts-out")) {
            contentPath = path.join(__dirname, "/ts-out/content/splash.html");
        }
    }
});
storage.get("settings", function (error, data: any) {
    if (error) throw error;
    console.log(data);
    channel = data.channel;
    settings = data;
});
app.whenReady().then(async () => {
    switch (await getConfigUnsafe("windowStyle")) {
        case "default":
            createCustomWindow();
            customTitlebar = true;
            break;
        case "native":
            createNativeWindow();
            break;
        case "glasstron":
            dialog.showErrorBox("Glasstron is unsupported.", "This build doesn't include Glasstron functionality, please edit windowStyle value in your settings.json to something different (default for example)")
            app.quit()
            break;
        case "tabs":
            createTabsHost();
            tabs = true;
            break;
        default:
            createCustomWindow();
            customTitlebar = true;
            break;
    }
    session.fromPartition("some-partition").setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === "notifications") {
            // Approves the permissions request
            callback(true);
        }
        if (permission === "media") {
            // Approves the permissions request
            callback(true);
        }
    });
    app.on("activate", async function () {
        if (BrowserWindow.getAllWindows().length === 0)
            switch (await getConfigUnsafe("windowStyle")) {
                case "default":
                    createCustomWindow();
                    break;
                case "native":
                    createNativeWindow();
                    break;
                case "glasstron":
                    dialog.showErrorBox("Glasstron is unsupported.", "This build doesn't include Glasstron functionality, please edit windowStyle value in your settings.json to something different (default for example)")
                    app.quit()
                    break;
                default:
                    createCustomWindow();
                    break;
            }
    });
});

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
});
