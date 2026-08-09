import type { Configuration } from "electron-builder";

import { applyAppImageSandboxFix } from "./scripts/build/sandboxFix.mjs";
import debianLicence from "./scripts/spdxLicenceDebianFormat";
import { ACTION_FRIENDLY_NAMES, EXCLUDED_FROM_SHORTCUTS, ValidActions } from "./src/common/commandDefinitions";

const desktopActions = (exec: "AppRun" | "/opt/Legcord/legcord") =>
    Object.fromEntries(
        (Object.values(ValidActions) as ValidActions[])
            .filter((action) => !EXCLUDED_FROM_SHORTCUTS.includes(action))
            .map((action) => [
                action,
                {
                    Name: ACTION_FRIENDLY_NAMES[action],
                    Exec: `${exec} --${action} %U`,
                },
            ]),
    );

const availableActions = (Object.values(ValidActions) as ValidActions[])
    .filter((action) => !EXCLUDED_FROM_SHORTCUTS.includes(action))
    .join(";");

export const config: Configuration = {
    appId: "app.legcord.Legcord",
    productName: "Legcord",
    // Biome treats electron-builder macro placeholders as template syntax.
    // biome-ignore lint/suspicious/noTemplateCurlyInString: electron-builder expands these placeholders.
    artifactName: "Legcord-${version}-${os}-${arch}.${ext}",
    beforePack: applyAppImageSandboxFix,
    protocols: [
        {
            name: "Discord",
            schemes: ["discord"],
        },
    ],
    mac: {
        category: "public.app-category.social-networking",
        darkModeSupport: true,
        notarize: true,
        extendInfo: {
            NSMicrophoneUsageDescription: "Legcord requires access to the microphone to function properly.",
            NSCameraUsageDescription: "Legcord requires access to the camera to function properly.",
            NSAudioCaptureUsageDescription:
                "Legcord requires access to system audio to share sound during screenshare.",
            NSCameraUseContinuityCameraDeviceType: true,
            "com.apple.security.device.audio-input": true,
            "com.apple.security.device.camera": true,
        },
        x64ArchFiles: "**/node_modules/koffi/**",
    },

    linux: {
        icon: "build/icon.icns",
        target: ["AppImage", "deb", "rpm", "tar.gz"],
        maintainer: "linux@legcord.app",
        category: "Network",
        desktop: {
            entry: {
                StartupWMClass: "legcord",
            },
        },
    },

    appImage: {
        desktop: {
            entry: {
                Actions: availableActions,
            },
            desktopActions: desktopActions("AppRun"),
        },
    },

    pacman: {
        depends: ["gtk3", "libnotify", "xdg-utils", "at-spi2-core", "alsa-lib", "nspr", "nss"],
    },

    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
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
        base: "core22",
        publish: {
            provider: "snapStore",
        },
    },

    deb: {
        category: "Network",
        icon: "build/icon.icns",
        depends: [
            "libasound2",
            "libnspr4",
            "libnss3",
            "libasound2-plugins",
            "libatk1.0-0 | libatk1.0-0t64",
            "libatk-bridge2.0-0",
            "libgbm1",
            "libasound2t64 | libasound2",
            "libcups2",
            "libgtk3.0 | libgtk-3-0",
            "at-spi2-common",
        ],
        desktop: {
            entry: {
                Actions: availableActions,
            },
            desktopActions: desktopActions("/opt/Legcord/legcord"),
        },
        fpm: [`${debianLicence()}=/usr/share/doc/legcord/copyright`],
    },

    files: [
        "!*",
        "assets",
        "node-modules",
        "ts-out",
        "dist/venmic-arm64.node",
        "dist/venmic-x64.node",
        "package.json",
        "license.txt",
    ],

    electronDownload: {
        cache: ".cache",
    },

    electronFuses: {
        runAsNode: false,
        enableCookieEncryption: false,
        enableNodeOptionsEnvironmentVariable: false,
        enableNodeCliInspectArguments: false,
        enableEmbeddedAsarIntegrityValidation: false,
        onlyLoadAppFromAsar: true,
        loadBrowserProcessSpecificV8Snapshot: false,
        grantFileProtocolExtraPrivileges: false,
    },
    toolsets: {
        appimage: "1.0.3",
    },
};

export default config;
