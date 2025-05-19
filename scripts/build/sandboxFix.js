/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Based on https://github.com/gergof/electron-builder-sandbox-fix/blob/master/lib/index.js

import { chmod, cp, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
let isApplied = false;

const hook = async () => {
    if (isApplied) return;
    isApplied = true;
    if (process.platform !== "linux") {
        // this fix is only required on linux
        return;
    }
    const AppImageTarget = import("app-builder-lib/out/targets/AppImageTarget.js");
    const AppImageTargetClass = (await AppImageTarget).default;
    const oldBuildMethod = AppImageTargetClass.prototype.build;
    AppImageTargetClass.prototype.build = async function (...args) {
        console.log("Running AppImage builder hook", args);
        const oldPath = args[0];
        const newPath = `${oldPath}-appimage-sandbox-fix`;
        // just in case
        try {
            await rm(newPath, {
                recursive: true,
            });
        } catch {}

        console.log("Copying to apply appimage fix", oldPath, newPath);
        await cp(oldPath, newPath, {
            recursive: true,
        });
        args[0] = newPath;

        const executable = join(newPath, this.packager.executableName);

        const loaderScript = `
#!/usr/bin/env bash

SCRIPT_DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
IS_STEAMOS=0

if [[ "$SteamOS" == "1" && "$SteamGamepadUI" == "1" ]]; then
    echo "Running Legcord on SteamOS, disabling sandbox"
    IS_STEAMOS=1
fi

exec "$SCRIPT_DIR/${this.packager.executableName}.bin" "$([ "$IS_STEAMOS" == 1 ] && echo '--no-sandbox')" "$@"
                `.trim();

        try {
            await rename(executable, `${executable}.bin`);
            await writeFile(executable, loaderScript);
            await chmod(executable, 0o755);
        } catch (e) {
            console.error(`failed to create loder for sandbox fix: ${e.message}`);
            throw new Error("Failed to create loader for sandbox fix");
        }

        const ret = await oldBuildMethod.apply(this, args);

        await rm(newPath, {
            recursive: true,
        });

        return ret;
    };
};

export default hook;
