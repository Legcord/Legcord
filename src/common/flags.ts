import { powerMonitor, app } from "electron";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
    enableFeatures: ["TurnOffStreamingMediaCachingOnBattery"],
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
    switch (getConfig("performanceMode")) {
        case "dynamic":
            if (powerMonitor.isOnBatteryPower()) {
                console.log("Battery mode enabled");
                return mergeWithCustomFlags(battery);
            } else {
                console.log("Performance mode enabled");
                return mergeWithCustomFlags(performance);
            }
        case "performance":
            console.log("Performance mode enabled");
            return mergeWithCustomFlags(performance);
        case "battery":
            console.log("Battery mode enabled");
            return mergeWithCustomFlags(battery);
        case "vaapi":
            console.log("VAAPI mode enabled");
            return mergeWithCustomFlags(vaapi);
        case "smoothScreenshare":
            console.log("Smooth screenshare mode enabled");
            return mergeWithCustomFlags(smoothExperiment);
        default:
            console.log("No performance modes set");
    }
}

/**
 * Get the currently applied preset for debugging purposes
 */
export function getCurrentPreset(): Preset | undefined {
    return getPreset();
}
