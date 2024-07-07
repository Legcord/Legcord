//@ts-check

import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";
import {nodeResolve} from "@rollup/plugin-node-resolve";
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
            //        nodeResolve(), we don't need to bundle node_modules cuz it breaks electron
            typescript(),
            copy({
                targets: [
                    {src: "src/**/**/*.html", dest: "ts-out/"},
                    {src: "src/**/**/*.css", dest: "ts-out/"},
                    {src: "src/**/**/*.js", dest: "ts-out/"},
                    {src: "package.json", dest: "ts-out/"},
                    {src: "assets/**/**", dest: "ts-out/"}
                ]
            })
        ]
    },
    {
        input: "src/discord/preload/preload.mts",
        output: {
            dir: "ts-out/discord",
            format: "esm",
            sourcemap: true,
        },
        plugins: [typescript()]
    }
    ,
    {
        input: "src/splash/preload.mts",
        output: {
            dir: "ts-out/splash",
            format: "esm",
            sourcemap: true,
        },
        plugins: [typescript()]
    }
]);
