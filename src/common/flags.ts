import { readFileSync } from "node:fs";
import { join } from "node:path";
import { app, powerMonitor } from "electron";
import isDev from "electron-is-dev";
import { getConfig } from "./config.js";

interface Preset {
    switches: [string, string?][];
    enableFeatures: string[];
    disableFeatures: string[];
}

// Cache for custom flags to avoid repeated file reads
let customFlagsCache: Preset | null = null;

const performance: Preset = {
    switches: [
        ["enable-gpu-rasterization"],
        ["enable-zero-copy"],
        ["ignore-gpu-blocklist"],
        ["enable-hardware-overlays", "single-fullscreen,single-on-top,underlay"],
        ["force_high_performance_gpu"],
    ],
    enableFeatures: [
        "EnableDrDc",
        "CanvasOopRasterization",
        "BackForwardCache:TimeToLiveInBackForwardCacheInSeconds/300/should_ignore_blocklists/true/enable_same_site/true",
        "ThrottleDisplayNoneAndVisibilityHiddenCrossOriginIframes",
        "UseSkiaRenderer",
        "WebAssemblyLazyCompilation",
    ],
    disableFeatures: ["Vulkan"],
};

/** Light GPU boost without forcing the discrete GPU — a middle ground. */
const balanced: Preset = {
    switches: [["enable-gpu-rasterization"], ["enable-zero-copy"], ["ignore-gpu-blocklist"]],
    enableFeatures: [
        "CanvasOopRasterization",
        "UseSkiaRenderer",
        "WebAssemblyLazyCompilation",
        "CalculateNativeWinOcclusion",
        "ThrottleDisplayNoneAndVisibilityHiddenCrossOriginIframes",
    ],
    disableFeatures: ["Vulkan"],
};

/** Reduce RAM / CPU usage at the cost of some visual smoothness. */
const memory: Preset = {
    switches: [
        ["enable-low-end-device-mode"],
        ["enable-low-res-tiling"],
        ["process-per-site"],
        ["renderer-process-limit", "2"],
        ["force_low_power_gpu"],
        ["disk-cache-size", "67108864"], // 64 MB
        ["skia-resource-cache-limit-mb", "64"],
    ],
    enableFeatures: ["CalculateNativeWinOcclusion", "TurnOffStreamingMediaCachingOnBattery"],
    disableFeatures: [],
};

/** Favor voice/video call quality with HW WebRTC encode/decode. */
const voip: Preset = {
    switches: [
        ["enable-gpu-rasterization"],
        ["enable-zero-copy"],
        ["ignore-gpu-blocklist"],
        ["force_high_performance_gpu"],
        ["disable-background-timer-throttling"],
        ["disable-renderer-backgrounding"],
        ["disable-backgrounding-occluded-windows"],
        ["enable-gpu-memory-buffer-video-frames"],
    ],
    enableFeatures: [
        "WebRtcHWDecoding",
        "WebRtcHWEncoding",
        "AcceleratedVideoDecoder",
        "AcceleratedVideoEncoder",
        "AcceleratedVideoDecodeLinuxGL",
        "AcceleratedVideoDecodeLinuxZeroCopyGL",
        "ZeroCopyDesktopCapture",
    ],
    disableFeatures: ["UseChromeOSDirectVideoDecoder"],
};

/** Minimize input/render latency; keeps the app hot in the background. */
const latency: Preset = {
    switches: [
        ["enable-gpu-rasterization"],
        ["enable-zero-copy"],
        ["ignore-gpu-blocklist"],
        ["force_high_performance_gpu"],
        ["enable-hardware-overlays", "single-fullscreen,single-on-top,underlay"],
        ["disable-background-timer-throttling"],
        ["disable-renderer-backgrounding"],
        ["disable-backgrounding-occluded-windows"],
        ["disable-ipc-flooding-protection"],
        ["disable-backing-store-limit"],
    ],
    enableFeatures: ["EnableDrDc", "CanvasOopRasterization", "UseSkiaRenderer", "WebAssemblyLazyCompilation"],
    disableFeatures: ["Vulkan"],
};

const smoothExperiment: Preset = {
    switches: [
        ["enable-gpu-rasterization"],
        ["enable-zero-copy"],
        ["ignore-gpu-blocklist"],
        ["disable-background-timer-throttling"],
        ["disable-renderer-backgrounding"],
        ["enable-hardware-overlays", "single-fullscreen,single-on-top,underlay"],
        ["force_high_performance_gpu"],
        ["use-gl", "desktop"],
    ],
    enableFeatures: [
        "EnableDrDc",
        "CanvasOopRasterization",
        "BackForwardCache:TimeToLiveInBackForwardCacheInSeconds/300/should_ignore_blocklists/true/enable_same_site/true",
        "ThrottleDisplayNoneAndVisibilityHiddenCrossOriginIframes",
        "UseSkiaRenderer",
        "WebAssemblyLazyCompilation",
        "AcceleratedVideoDecodeLinuxGL",
        "AcceleratedVideoEncoder",
        "AcceleratedVideoDecoder",
        "AcceleratedVideoDecodeLinuxZeroCopyGL",
        "ZeroCopyDesktopCapture",
    ],
    disableFeatures: ["Vulkan", "UseChromeOSDirectVideoDecoder"],
};

const battery: Preset = {
    // Known to have better battery life for Chromium?
    switches: [
        ["force_low_power_gpu"],
        ["enable-low-end-device-mode"],
        ["enable-low-res-tiling"],
        ["process-per-site"],
    ],
    enableFeatures: ["TurnOffStreamingMediaCachingOnBattery", "CalculateNativeWinOcclusion"],
    disableFeatures: [],
};

const vaapi: Preset = {
    switches: [
        ["ignore-gpu-blocklist"],
        ["enable-gpu-rasterization"],
        ["enable-zero-copy"],
        ["force_high_performance_gpu"],
        ["use-gl", "desktop"],
    ],
    enableFeatures: [
        "AcceleratedVideoDecodeLinuxGL",
        "AcceleratedVideoEncoder",
        "AcceleratedVideoDecoder",
        "AcceleratedVideoDecodeLinuxZeroCopyGL",
    ],
    disableFeatures: ["UseChromeOSDirectVideoDecoder"],
};

/**
 * Load custom flags from JSON file in user data directory (cached after first load)
 * Path:
 *   - Windows: %APPDATA%\legcord\flags.json (typically C:\Users\{username}\AppData\Roaming\legcord\flags.json)
 *   - macOS: ~/Library/Application Support/legcord/flags.json
 *   - Linux: ~/.config/legcord/flags.json
 * Returns an empty preset if file doesn't exist or is invalid
 */
function loadCustomFlags(): Preset {
    // Return cached result to avoid repeated disk reads
    if (customFlagsCache !== null) {
        return customFlagsCache;
    }

    const customPreset: Preset = {
        switches: [],
        enableFeatures: [],
        disableFeatures: [],
    };

    try {
        const userDataPath = app.getPath("userData");
        const customFlagsPath = join(userDataPath, "flags.json");

        try {
            const fileContent = readFileSync(customFlagsPath, "utf-8");
            const customFlags = JSON.parse(fileContent);

            // Merge switches
            if (Array.isArray(customFlags.switches)) {
                customPreset.switches = customFlags.switches;
            }

            // Merge enableFeatures
            if (Array.isArray(customFlags.enableFeatures)) {
                customPreset.enableFeatures = customFlags.enableFeatures;
            }

            // Merge disableFeatures
            if (Array.isArray(customFlags.disableFeatures)) {
                customPreset.disableFeatures = customFlags.disableFeatures;
            }

            if (isDev) console.log(`Custom flags loaded from ${customFlagsPath}`);
        } catch (fileError) {
            if ((fileError as NodeJS.ErrnoException).code === "ENOENT") {
                if (isDev) console.log(`Custom flags file not found at ${customFlagsPath}`);
            } else if (isDev) {
                console.error(`Error reading custom flags file: ${fileError}`);
            }
        }
    } catch (error) {
        if (isDev) console.error(`Error loading custom flags: ${error}`);
    }

    customFlagsCache = customPreset;
    return customPreset;
}

/**
 * Merge a preset with custom flags
 * Custom flags will be appended to the preset's arrays
 */
function mergeWithCustomFlags(preset: Preset): Preset {
    const customFlags = loadCustomFlags();

    return {
        switches: [...preset.switches, ...customFlags.switches],
        enableFeatures: [...preset.enableFeatures, ...customFlags.enableFeatures],
        disableFeatures: [...preset.disableFeatures, ...customFlags.disableFeatures],
    };
}

function mergePresets(base: Preset, extra: Preset): Preset {
    return {
        switches: [...base.switches, ...extra.switches],
        enableFeatures: [...base.enableFeatures, ...extra.enableFeatures],
        disableFeatures: [...base.disableFeatures, ...extra.disableFeatures],
    };
}

export function getPreset(): Preset | undefined {
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
    let preset: Preset | undefined;

    switch (getConfig("performanceMode")) {
        case "dynamic":
            if (powerMonitor.isOnBatteryPower()) {
                console.log("Battery mode enabled");
                preset = battery;
            } else {
                console.log("Performance mode enabled");
                preset = performance;
            }
            break;
        case "performance":
            console.log("Performance mode enabled");
            preset = performance;
            break;
        case "balanced":
            console.log("Balanced mode enabled");
            preset = balanced;
            break;
        case "battery":
            console.log("Battery mode enabled");
            preset = battery;
            break;
        case "memory":
            console.log("Memory saver mode enabled");
            preset = memory;
            break;
        case "voip":
            console.log("Voice & video mode enabled");
            preset = voip;
            break;
        case "latency":
            console.log("Low latency mode enabled");
            preset = latency;
            break;
        case "smoothScreenshare":
            console.log("Smooth screenshare mode enabled");
            preset = smoothExperiment;
            break;
        default:
            console.log("No performance modes set");
    }

    if (getConfig("vaapi")) {
        console.log("VAAPI flags enabled");
        preset = preset ? mergePresets(preset, vaapi) : vaapi;
    }

    if (preset) {
        return mergeWithCustomFlags(preset);
    }
}

/**
 * Get the currently applied preset for debugging purposes
 */
export function getCurrentPreset(): Preset | undefined {
    return getPreset();
}
