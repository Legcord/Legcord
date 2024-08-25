import {createWriteStream} from "fs";
import type {LatestReleaseResponseTruncated} from "./src/types/GithubApi.d.js";
import {finished, Readable} from "stream";
import {ReadableStream} from "stream/web";
import {promisify} from "util";

async function betterdiscord() {
    const githubData = await fetch("https://api.github.com/repos/betterdiscord/betterdiscord/releases/latest")
        .then(async (response) => (await response.json()) as LatestReleaseResponseTruncated)
        .then((data) => {
            return data;
        });

    const asarUrl = githubData.assets.find((asset) => asset.name === "betterdiscord.asar")?.browser_download_url;

    if (!asarUrl) {
        throw new Error("MISSING_ASSET");
    }

    await fetch(asarUrl).then(async (contents) => {
        const fileStream = createWriteStream("betterdiscord.asar");
        await promisify(finished)(Readable.fromWeb(contents.body as ReadableStream).pipe(fileStream));
    });
}

await betterdiscord();
