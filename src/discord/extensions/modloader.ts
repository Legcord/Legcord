import {writeFileSync} from "fs";
import {getConfig} from "../../common/config.js";
import {app} from "electron";
import {join} from "path";
import type {LatestReleaseResponseTruncated} from "../../types/GithubApi.d.js";
import type {ValidMods} from "../../types/settings.d.js";

async function fetchMod(fileName: string, url: string) {
    await fetch(url).then(async (contents) => {
        const fileContent = await contents.text();
        if (!contents.ok || !fileContent) {
            throw new Error("BAD_RESPONSE");
        }
        writeFileSync(join(app.getPath("userData"), fileName), fileContent);
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
    const githubData = await fetch("https://api.github.com/repos/betterdiscord/betterdiscord/releases/latest")
        .then(async (response) => (await response.json()) as LatestReleaseResponseTruncated)
        .then((data) => {
            console.log(data.assets);
            return data;
        });

    const asarUrl = githubData.assets.find((asset) => asset.name === "betterdiscord.asar")?.browser_download_url;

    if (!asarUrl) {
        throw new Error("MISSING_ASSET");
    }

    await fetch(asarUrl).then((contents) => {
        console.log(contents);
    });
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
