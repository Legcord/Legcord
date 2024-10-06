// @ts-check

import commonjs from "@rollup/plugin-commonjs";
import esmShim from "@rollup/plugin-esm-shim";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import copy from "rollup-plugin-copy";
import { minify } from "rollup-plugin-esbuild";

const prodEnv = process.env.BUILD === "prod";

const electronExternals = ["electron", "node:fs", "node:path", "node:os", "node:url"];

export default defineConfig([
    {
        input: "src/main.ts",
        output: {
            dir: "ts-out",
            format: "esm",
            sourcemap: true,
        },
        external: [
            ...electronExternals,
            "electron",
            "v8-compile-cache",
            "electron-is-dev",
            "electron-context-menu",
            "arrpc",
            "stream",
            "stream/promises",
        ],
        plugins: [
            commonjs(),
            esmShim(),
            json(),
            minify({ minify: prodEnv }),
            typescript(),
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
        input: "src/discord/preload/preload.mts",
        output: {
            dir: "ts-out/discord",
            entryFileNames: "[name].mjs",
            format: "esm",
            sourcemap: true,
        },
        external: electronExternals,
        plugins: [typescript(), minify({ minify: prodEnv })],
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
        plugins: [typescript(), minify({ minify: prodEnv })],
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
        plugins: [typescript(), minify({ minify: prodEnv })],
    },
    {
        input: "src/themeManager/preload.mts",
        output: {
            dir: "ts-out/themeManager",
            format: "esm",
            entryFileNames: "[name].mjs",
            sourcemap: true,
        },
        external: electronExternals,
        plugins: [typescript(), minify({ minify: prodEnv })],
    },
    {
        input: "src/screenshare/preload.mts",
        output: {
            dir: "ts-out/screenshare",
            format: "esm",
            entryFileNames: "[name].mjs",
            sourcemap: true,
        },
        external: electronExternals,
        plugins: [typescript(), minify({ minify: prodEnv })],
    },
]);
