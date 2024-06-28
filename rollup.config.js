//@ts-check

import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";
import {defineConfig} from "rollup";

export default defineConfig({
    input: "src/main.ts",
    output: {
        dir: "ts-out",
        format: "esm",
        sourcemap: true
    },
    plugins: [
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
});
