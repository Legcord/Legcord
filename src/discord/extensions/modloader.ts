import {createWriteStream} from "original-fs"; // NOTE - Electron will NOT download asar files without this
import {getConfig} from "../../common/config.js";
import {app} from "electron";
import {join} from "path";
import type {ValidMods} from "../../types/settings.d.js";
import {finished} from "stream/promises";
import {Readable} from "stream";
import type {ReadableStream} from "stream/web";

async function fetchMod(file: string, url: string) {
    await fetch(url).then(async (contents) => {
        if (!contents.ok) {
            throw new Error("BAD_RESPONSE");
        }
        const fileStream = createWriteStream(join(app.getPath("userData"), file));
        await finished(Readable.fromWeb(contents.body as ReadableStream).pipe(fileStream));
    });
}

const modFetchers: (() => Promise<void>)[] = [];

async function shelter() {
    await fetchMod("shelter.js", "https://raw.githubusercontent.com/uwu/shelter-builds/main/shelter.js");
}

async function vencord() {
    await fetchMod("vencord.js", "https://github.com/Vendicated/Vencord/releases/download/devbuild/browser.js");
    await fetchMod("vencord.css", "https://github.com/Vendicated/Vencord/releases/download/devbuild/browser.css");
}

async function betterdiscord() {
    await fetchMod("betterdiscord.asar", "https://betterdiscord.app/Download/betterdiscord.asar");
}

async function custom() {
    console.log("Downloading Custom Mods");
    await fetchMod("custom.js", getConfig("customJsBundle"));
    await fetchMod("custom.css", getConfig("customCssBundle"));
}

modFetchers.push(shelter, vencord, betterdiscord, custom);

export async function fetchMods() {
    const activeMods = getConfig("mods");
    for (const fx of modFetchers) {
        if (activeMods.includes(fx.name as ValidMods) || fx.name === "shelter") {
            try {
                console.log(`Downloading ${fx.name}`);
                await fx();
            } catch (error) {
                console.error(`Failed to download ${fx.name} mod`);
                console.error(error);
            }
        }
    }
}
