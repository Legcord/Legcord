//@ts-check

import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";
import { minify } from 'rollup-plugin-esbuild-minify'
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import esmShim from "@rollup/plugin-esm-shim";
import {defineConfig} from "rollup";

export default defineConfig([
    {
        input: "src/main.ts",
        output: {
            dir: "ts-out",
            format: "esm",
            sourcemap: true
        },
        plugins: [
            commonjs(),
            esmShim(),
            json(),
            minify({minify: process.env.BUILD === 'prod' ? true : false,}),
            //        nodeResolve(), we don't need to bundle node_modules cuz it breaks electron
            typescript(),
            copy({
                targets: [
                    {src: "src/**/**/*.html", dest: "ts-out/html/"},
                    {src: "src/**/**/*.css", dest: "ts-out/css/"},
                    {src: "src/**/**/*.js", dest: "ts-out/js/"},
                    {src: "package.json", dest: "ts-out/"},
                    {src: "assets/**/**", dest: "ts-out/assets/"}
                ]
            })
        ]
    },
    {
        input: "src/discord/preload/preload.mts",
        output: {
            dir: "ts-out/discord",
            entryFileNames: "[name].mjs",
            format: "esm",
            sourcemap: true,
        },
        plugins: [typescript(), minify({minify: process.env.BUILD === 'prod' ? true : false})]
    }
    ,
    {
        input: "src/splash/preload.mts",
        output: {
            dir: "ts-out/splash",
            format: "esm",
            entryFileNames: "[name].mjs",
            sourcemap: true,
        },
        plugins: [typescript(), minify({minify: process.env.BUILD === 'prod' ? true : false})]
    },
    {
        input: "src/settings/preload.mts",
        output: {
            dir: "ts-out/settings",
            format: "esm",
            entryFileNames: "[name].mjs",
            sourcemap: true,
        },
        plugins: [typescript(), minify({minify: process.env.BUILD === 'prod' ? true : false})]
    },
    {
        input: "src/setup/preload.mts",
        output: {
            dir: "ts-out/setup",
            format: "esm",
            entryFileNames: "[name].mjs",
            sourcemap: true,
        },
        plugins: [typescript(), minify({minify: process.env.BUILD === 'prod' ? true : false})]
    },
    {
        input: "src/themeManager/preload.mts",
        output: {
            dir: "ts-out/themeManager",
            format: "esm",
            entryFileNames: "[name].mjs",
            sourcemap: true,
        },
        plugins: [typescript(), minify({minify: process.env.BUILD === 'prod' ? true : false})]
    },
    {
        input: "src/screenshare/preload.mts",
        output: {
            dir: "ts-out/screenshare",
            format: "esm",
            entryFileNames: "[name].mjs",
            sourcemap: true,
        },
        plugins: [typescript(), minify({minify: process.env.BUILD === 'prod' ? true : false})]
    }
]);
