import type { ModData } from "../@types/consts.js";

export const modData: ModData = {
    vencord: {
        repoData: {
            owner: "vendicated",
            repo: "vencord",
            branch: "main",
        },
        js: "https://github.com/Vendicated/Vencord/releases/download/devbuild/browser.js",
        css: "https://github.com/Vendicated/Vencord/releases/download/devbuild/browser.css",
    },
    equicord: {
        repoData: {
            owner: "equicord",
            repo: "equicord",
            branch: "main",
        },
        js: "https://github.com/Equicord/Equicord/releases/download/latest/browser.js",
        css: "https://github.com/Equicord/Equicord/releases/download/latest/browser.css",
    },
    shelter: {
        repoData: {
            owner: "uwu",
            repo: "shelter-builds",
            branch: "main",
        },
        js: "https://raw.githubusercontent.com/uwu/shelter-builds/main/shelter.js",
    },
    custom: {
        repoData: {
            owner: "DoNotChange",
            repo: "CustomMod",
            branch: "DoNotChange",
        },
        js: "DoNotChange",
    },
};
