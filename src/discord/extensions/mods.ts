import {app, dialog} from "electron";
import extract from "extract-zip";
import path from "path";
import {getConfig} from "../../common/config";
import fs from "fs";
import {pipeline} from "stream";
const streamPipeline = pipeline;
async function updateModBundle(): Promise<void> {
    if (getConfig("noBundleUpdates") == undefined ?? false) {
        try {
            console.log("Downloading mod bundle");
            const distFolder = `${app.getPath("userData")}/plugins/loader/dist/`;
            while (!fs.existsSync(distFolder)) {
                //waiting
            }
            let name: string = getConfig("mods");
            if (name == "custom") {
                // aspy fix
                let bundle: string = await (await fetch(getConfig("customJsBundle"))).text();
                fs.writeFileSync(`${distFolder}bundle.js`, bundle, "utf-8");
                let css: string = await (await fetch(getConfig("customCssBundle"))).text();
                fs.writeFileSync(`${distFolder}bundle.css`, css, "utf-8");
            } else {
                const clientMods = {
                    vencord: "https://github.com/Vendicated/Vencord/releases/download/devbuild/browser.js",
                    shelter: "https://raw.githubusercontent.com/uwu/shelter-builds/main/shelter.js"
                };
                const clientModsCss = {
                    vencord: "https://github.com/Vendicated/Vencord/releases/download/devbuild/browser.css",
                    shelter: "https://armcord.app/placeholder.css"
                };
                console.log(clientMods[name as keyof typeof clientMods]);
                let bundle: string = await (await fetch(clientMods[name as keyof typeof clientMods])).text();
                fs.writeFileSync(`${distFolder}bundle.js`, bundle, "utf-8");
                let css: string = await (await fetch(clientModsCss[name as keyof typeof clientModsCss])).text();
                fs.writeFileSync(`${distFolder}bundle.css`, css, "utf-8");
            }
        } catch (e) {
            console.log("[Mod loader] Failed to install mods");
            console.error(e);
            dialog.showErrorBox(
                "Oops, something went wrong.",
                "ArmCord couldn't install mods, please check if you have stable internet connection and restart the app. If this issue persists, report it on the support server/Github issues."
            );
        }
    } else {
        console.log("[Mod loader] Skipping mod bundle update");
    }
}

export let modInstallState: string;
export function updateModInstallState() {
    modInstallState = "modDownload";

    void updateModBundle(); // REVIEW - Awaiting this will hang the app on the splash
    import("./plugin.js");

    modInstallState = "done";
}

export async function installModLoader(): Promise<void> {
    if (getConfig("mods") == "none") {
        modInstallState = "none";
        fs.rmSync(`${app.getPath("userData")}/plugins/loader`, {recursive: true, force: true});

        import("./plugin.js");
        console.log("[Mod loader] Skipping");

        return;
    }

    const pluginFolder = `${app.getPath("userData")}/plugins/`;
    if (fs.existsSync(`${pluginFolder}loader`) && fs.existsSync(`${pluginFolder}loader/dist/bundle.css`)) {
        updateModInstallState();
        return;
    }

    try {
        fs.rmSync(`${app.getPath("userData")}/plugins/loader`, {recursive: true, force: true});
        modInstallState = "installing";

        let zipPath = `${app.getPath("temp")}/loader.zip`;

        if (!fs.existsSync(pluginFolder)) {
            fs.mkdirSync(pluginFolder);
            console.log("[Mod loader] Created missing plugin folder");
        }

        // Add more of these later if needed!
        let URLs = [
            "https://armcord.app/loader.zip",
            "https://armcord.vercel.app/loader.zip",
            "https://raw.githubusercontent.com/ArmCord/website/new/public/loader.zip"
        ];
        let loaderZip: any;

        while (true) {
            if (URLs.length <= 0) throw new Error(`unexpected response ${loaderZip.statusText}`);

            try {
                loaderZip = await fetch(URLs[0]);
            } catch (err) {
                console.log("[Mod loader] Failed to download. Links left to try: " + (URLs.length - 1));
                URLs.splice(0, 1);

                continue;
            }

            break;
        }

        streamPipeline(loaderZip.body, fs.createWriteStream(zipPath));
        await extract(zipPath, {dir: path.join(app.getPath("userData"), "plugins")});

        updateModInstallState();
    } catch (e) {
        console.log("[Mod loader] Failed to install modloader");
        console.error(e);
        dialog.showErrorBox(
            "Oops, something went wrong.",
            "ArmCord couldn't install internal mod loader, please check if you have stable internet connection and restart the app. If this issue persists, report it on the support server/Github issues."
        );
    }
}
