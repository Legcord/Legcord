// @ts-check

import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import esmShim from "@rollup/plugin-esm-shim";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import copy from "rollup-plugin-copy";
import { minify } from "rollup-plugin-esbuild";

const prodEnv = process.env.BUILD === "prod";

const electronExternals = ["electron", "node:fs", "node:path", "node:os", "node:url", "@vencord/venmic"];

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
            "electron-is-dev",
            "electron-updater",
            "electron-context-menu",
            "arrpc",
            "path",
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
        input: "src/rpc.ts",
        output: {
            dir: "ts-out",
            format: "esm",
            sourcemap: true,
        },
        external: [...electronExternals, "arrpc"],
        plugins: [commonjs(), esmShim(), json(), minify({ minify: prodEnv }), typescript()],
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
        input: "src/cssEditor/preload.mts",
        output: {
            dir: "ts-out/cssEditor",
            format: "esm",
            entryFileNames: "[name].mjs",
            sourcemap: true,
        },
        external: electronExternals,
        plugins: [typescript(), minify({ minify: prodEnv })],
    },
    {
        input: "src/proxy/preload.mts",
        output: {
            dir: "ts-out/proxy",
            format: "esm",
            entryFileNames: "[name].mjs",
            sourcemap: true,
        },
        external: electronExternals,
        plugins: [typescript(), minify({ minify: prodEnv })],
    },
    {
        input: "src/setup/setup.tsx",
        output: {
            dir: "ts-out/html",
            format: "esm",
            entryFileNames: "[name].js",
            sourcemap: true,
        },
        external: electronExternals,
        plugins: [
            commonjs(),
            replace({
                "process.env.NODE_ENV": JSON.stringify("production"),
            }),
            nodeResolve({ browser: true }),
            typescript(),
            minify({ minify: prodEnv }),
            babel({
                presets: ["solid"],
                babelHelpers: "bundled",
                exclude: "node_modules/**",
                extensions: [".ts", ".tsx"],
            }),
        ],
    },
]);
