import {app} from "electron";
import {getConfig} from "./config.js";

export let transparency: boolean;
export async function injectElectronFlags(): Promise<void> {
    //     MIT License

    // Copyright (c) 2022 GooseNest

    // Permission is hereby granted, free of charge, to any person obtaining a copy
    // of this software and associated documentation files (the "Software"), to deal
    // in the Software without restriction, including without limitation the rights
    // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    // copies of the Software, and to permit persons to whom the Software is
    // furnished to do so, subject to the following conditions:

    // The above copyright notice and this permission notice shall be included in all
    // copies or substantial portions of the Software.

    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    // SOFTWARE.
    const presets = {
        performance: `--enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist --enable-hardware-overlays=single-fullscreen,single-on-top,underlay --enable-features=EnableDrDc,CanvasOopRasterization,BackForwardCache:TimeToLiveInBackForwardCacheInSeconds/300/should_ignore_blocklists/true/enable_same_site/true,ThrottleDisplayNoneAndVisibilityHiddenCrossOriginIframes,UseSkiaRenderer,WebAssemblyLazyCompilation --disable-features=Vulkan --force_high_performance_gpu`, // Performance
        battery: "--enable-features=TurnOffStreamingMediaCachingOnBattery --force_low_power_gpu", // Known to have better battery life for Chromium?
        vaapi: "--ignore-gpu-blocklist --enable-features=VaapiVideoDecoder --enable-gpu-rasterization --enable-zero-copy --force_high_performance_gpu --use-gl=desktop --disable-features=UseChromeOSDirectVideoDecoder"
    };
    switch (await getConfig("performanceMode")) {
        case "performance":
            console.log("Performance mode enabled");
            app.commandLine.appendArgument(presets.performance);
            break;
        case "battery":
            console.log("Battery mode enabled");
            app.commandLine.appendArgument(presets.battery);
            break;
        default:
            console.log("No performance modes set");
    }
    if ((await getConfig("windowStyle")) == "transparent" && process.platform === "win32") {
        transparency = true;
    }
}
