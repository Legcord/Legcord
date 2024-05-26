import {BrowserWindow, app, dialog, ipcMain, shell} from "electron";
import path from "path";
import fs from "fs";
import {sleep} from "../common/sleep";
import {createInviteWindow, mainWindow} from "../discord/window";
let themeWindow: BrowserWindow;
let instance = 0;
interface ThemeManifest {
    name?: string;
    author?: string;
    description?: string;
    version?: string;
    invite?: string;
    authorId?: string;
    theme: string;
    authorLink?: string;
    donate?: string;
    patreon?: string;
    website?: string;
    source?: string;
    updateSrc?: string;
    supportsArmCordTitlebar?: boolean;
}
function parseBDManifest(content: string) {
    const metaReg = /@([^ ]*) (.*)/g;
    if (!content.startsWith("/**")) {
        throw new Error("Not a manifest.");
    }
    let manifest: ThemeManifest = {theme: "src.css"};

    let match;
    while ((match = metaReg.exec(content)) !== null) {
        let [_, key, value] = match;
        if (key === "import") break;

        value = value.trim();

        //console.log(key, value);

        switch (key) {
            case "name":
                manifest.name = value;
                break;

            case "description":
                manifest.description = value;
                break;

            case "version":
                manifest.version = value;
                break;

            case "author":
                manifest.author = value;
                break;

            case "invite":
                manifest.invite = value;
                break;

            case "authorId":
                manifest.authorId = value;
                break;

            case "authorLink":
                manifest.authorLink = value;
                break;

            case "donate":
                manifest.donate = value;
                break;

            case "patreon":
                manifest.patreon = value;
                break;

            case "website":
                manifest.website = value;
                break;

            case "source":
                manifest.source = value;
                break;
        }
    }

    return manifest;
}
const userDataPath = app.getPath("userData");
const themesPath = path.join(userDataPath, "/themes/");
export function createTManagerWindow(): void {
    console.log("Creating theme manager window.");
    instance += 1;
    if (instance > 1) {
        if (themeWindow) {
            themeWindow.show();
            themeWindow.restore();
        }
    } else {
        themeWindow = new BrowserWindow({
            width: 700,
            height: 600,
            title: `ArmCord Theme Manager`,
            darkTheme: true,
            frame: true,
            backgroundColor: "#2f3136",
            autoHideMenuBar: true,
            webPreferences: {
                sandbox: false,
                preload: path.join(import.meta.dirname, "preload.mjs")
            }
        });
        //setWindowHandler doesn't work for some reason
        themeWindow.webContents.on("will-navigate", function (e, url) {
            /* If url isn't the actual page */
            if (url != themeWindow.webContents.getURL()) {
                e.preventDefault();
                if (url.startsWith("https://discord.gg/")) {
                    createInviteWindow(url.replace("https://discord.gg/", ""));
                } else {
                    shell.openExternal(url);
                }
            }
        });

        async function managerLoadPage(): Promise<void> {
            themeWindow.loadFile(`${import.meta.dirname}/manager.html`);
        }
        const userDataPath = app.getPath("userData");
        const themesFolder = `${userDataPath}/themes/`;
        if (!fs.existsSync(themesFolder)) {
            fs.mkdirSync(themesFolder);
            console.log("Created missing theme folder");
        }
        if (!fs.existsSync(`${userDataPath}/disabled.txt`)) {
            fs.writeFileSync(path.join(userDataPath, "/disabled.txt"), "");
        }
        ipcMain.on("openThemesFolder", async () => {
            shell.showItemInFolder(themesPath);
            await sleep(1000);
        });
        ipcMain.on("reloadMain", async () => {
            mainWindow.webContents.reload();
        });
        ipcMain.on("addToDisabled", async (_event, name: string) => {
            fs.appendFileSync(path.join(userDataPath, "/disabled.txt"), `${name}\n`);
            sleep(1000);
        });
        ipcMain.on("disabled", async (e) => {
            e.returnValue = fs.readFileSync(path.join(userDataPath, "/disabled.txt")).toString();
        });
        ipcMain.on("removeFromDisabled", async (_event, name: string) => {
            let e = await fs.readFileSync(path.join(userDataPath, "/disabled.txt")).toString();
            fs.writeFileSync(path.join(userDataPath, "/disabled.txt"), e.replace(name, ""));
            sleep(1000);
        });
        ipcMain.on("uninstallTheme", async (_event, id: string) => {
            let themePath = path.join(themesFolder, id);
            if (fs.existsSync(themePath)) {
                fs.rmdirSync(themePath, {recursive: true});
                console.log(`Removed ${id} folder`);
            } else if (fs.existsSync(path.join(themesFolder, `${id}-BD`))) {
                fs.rmdirSync(path.join(themesFolder, `${id}-BD`), {recursive: true});
                console.log(`Removed ${id} folder`);
            }
            themeWindow.webContents.reload();
            mainWindow.webContents.reload();
        });
        ipcMain.on("installBDTheme", async (_event, link: string) => {
            try {
                let code = await (await fetch(link)).text();
                let manifest = parseBDManifest(code);
                let themePath = path.join(themesFolder, `${manifest.name?.replace(" ", "-")}-BD`);
                if (!fs.existsSync(themePath)) {
                    fs.mkdirSync(themePath);
                    console.log(`Created ${manifest.name} folder`);
                }
                manifest.updateSrc = link;
                if (code.includes(".titlebar")) manifest.supportsArmCordTitlebar = true;
                else manifest.supportsArmCordTitlebar = false;
                fs.writeFileSync(path.join(themePath, "manifest.json"), JSON.stringify(manifest));
                fs.writeFileSync(path.join(themePath, "src.css"), code);
                dialog.showMessageBoxSync({
                    type: "info",
                    title: "BD Theme import success",
                    message: "Successfully imported theme from link."
                });
                themeWindow.webContents.reload();
                mainWindow.webContents.reload();
            } catch (_e) {
                dialog.showErrorBox(
                    "BD Theme import fail",
                    "Failed to import theme from link. Please make sure that it's a valid BetterDiscord Theme."
                );
            }
        });
        themeWindow.webContents.on("did-finish-load", () => {
            fs.readdirSync(themesFolder).forEach((file) => {
                try {
                    const manifest = fs.readFileSync(`${themesFolder}/${file}/manifest.json`, "utf8");
                    console.log(manifest);
                    themeWindow.webContents.send("themeManifest", manifest);
                } catch (err) {
                    console.error(err);
                }
            });
        });

        managerLoadPage();
        themeWindow.on("close", () => {
            instance = 0;
        });
    }
}
