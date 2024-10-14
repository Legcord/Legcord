import type { Configuration } from "electron-builder";

export const config: Configuration = {
    appId: "app.legcord.Legcord",
    productName: "Legcord",
    artifactName: "Legcord-${version}-${os}-${arch}.${ext}",

    mac: {
        category: "public.app-category.social-networking",
        darkModeSupport: true,
        notarize: true,
        extendInfo: {
            NSMicrophoneUsageDescription: "Legcord requires access to the microphone to function properly.",
            NSCameraUsageDescription: "Legcord requires access to the camera to function properly.",
            "com.apple.security.device.audio-input": true,
            "com.apple.security.device.camera": true,
        },
    },

    linux: {
        icon: "build/icon.icns",
        target: ["AppImage", "deb", "rpm", "tar.gz"],
        maintainer: "linux@legcord.app",
        category: "Network",
    },

    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: false,
    },

    appx: {
        applicationId: "smartfrigde.Legcord",
        identityName: "53758smartfrigde.Legcord",
        publisher: "CN=EAB3A6D3-7145-4623-8176-D579F573F339",
        publisherDisplayName: "smartfrigde",
        backgroundColor: "white",
        showNameOnTiles: true,
    },

    snap: {
        environment: { ARRPC_NO_PROCESS_SCANNING: "true" },
        allowNativeWayland: true,
        executableArgs: ["--no-process-scanning"],
        base: "core24",
        publish: {
            provider: "snapStore",
        },
    },

    files: ["!*", "assets", "node-modules", "ts-out", "package.json", "license.txt"],

    electronDownload: {
        cache: ".cache",
    },

    flatpak: {
        baseVersion: "24.08",
        runtimeVersion: "24.08",
    },
};

export default config;
