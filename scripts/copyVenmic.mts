import { copyFile } from "node:fs/promises";

async function copyVenmic() {
    if (process.platform !== "linux") return;

    return Promise.all([
        copyFile(
            "./node_modules/@vencord/venmic/prebuilds/venmic-addon-linux-x64/node-napi-v7.node",
            "./dist/venmic-x64.node",
        ),
        copyFile(
            "./node_modules/@vencord/venmic/prebuilds/venmic-addon-linux-arm64/node-napi-v7.node",
            "./dist/venmic-arm64.node",
        ),
    ]).catch(() => console.warn("Failed to copy venmic. Building without venmic support"));
}

await Promise.all([copyVenmic()]);
