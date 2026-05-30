import solid from "@rolldown-plugin/solid";
import esmShim from "@rollup/plugin-esm-shim";
import { defineConfig } from "rolldown";
import copy from "rollup-plugin-copy";

const electronExternals = ["electron", "node:fs", "node:path", "node:os", "node:url", "@vencord/venmic"];

export default defineConfig([
    {
        input: "src/main.ts",
        output: {
            dir: "ts-out",
            format: "esm",
            sourcemap: true,
        },
        platform: "node",
        external: [
            ...electronExternals,
            "electron",
            "electron-is-dev",
            "electron-updater",
            "electron-context-menu",
            "arrpc",
            "path",
            "stream",
            "stream/promises",
        ],
        plugins: [
            esmShim(),
            copy({
                targets: [
                    { src: "src/**/**/*.html", dest: "ts-out/html/" },
                    { src: "src/**/**/*.css", dest: "ts-out/css/" },
                    { src: "src/**/**/*.js", dest: "ts-out/js/" },
                    { src: "package.json", dest: "ts-out/" },
                    { src: "assets/**/**", dest: "ts-out/assets/" },
                ],
            }),
        ],
    },
    {
        input: "src/rpc.ts",
        output: {
            dir: "ts-out",
            format: "esm",
            sourcemap: true,
        },
        external: [...electronExternals, "arrpc", "node:worker_threads"],
        plugins: [esmShim()],
    },
    {
        input: "src/discord/preload/preload.mts",
        output: {
            dir: "ts-out/discord",
            entryFileNames: "[name].mjs",
            format: "esm",
            sourcemap: true,
        },
        external: electronExternals,
    },
    {
        input: "src/splash/preload.mts",
        output: {
            dir: "ts-out/splash",
            format: "esm",
            entryFileNames: "[name].mjs",
            sourcemap: true,
        },
        external: electronExternals,
    },
    {
        input: "src/setup/preload.mts",
        output: {
            dir: "ts-out/setup",
            format: "esm",
            entryFileNames: "[name].mjs",
            sourcemap: true,
        },
        external: electronExternals,
    },
    {
        input: "src/cssEditor/preload.mts",
        output: {
            dir: "ts-out/cssEditor",
            format: "esm",
            entryFileNames: "[name].mjs",
            sourcemap: true,
        },
        external: electronExternals,
    },
    {
        input: "src/setup/setup.tsx",
        output: {
            dir: "ts-out/html",
            format: "esm",
            entryFileNames: "[name].js",
            sourcemap: true,
        },
        platform: "browser",
        external: [...electronExternals],
        plugins: [solid()],
    },
]);
