import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TouchBar, app, nativeImage } from "electron";
import { navigateTo } from "../common/dom.js";
import { deafenToggle, leaveCall, muteToggle } from "../common/keybindActions.js";
import { mainWindows } from "./window.js";

const { TouchBarButton, TouchBarSpacer, TouchBarPopover, TouchBarScrubber } = TouchBar;

const guildItems: Array<Electron.ScrubberItem> = [];

const scrollableList = new TouchBar({
    items: [
        new TouchBarScrubber({
            items: guildItems,
            continuous: false,
            select(selectedIndex) {
                //@ts-expect-error Electron types are wrong
                const guildID = guildItems[selectedIndex].accessibilityLabel;
                mainWindows.forEach((win) => {
                    navigateTo(win, `/channels/${guildID}`);
                });
            },
        }),
    ],
});

const muteIcon = nativeImage.createFromPath(join(import.meta.dirname, "../", "/assets/mute.png"));
const unmuteIcon = nativeImage.createFromPath(join(import.meta.dirname, "../", "/assets/mute-off.png"));

const deafenIcon = nativeImage.createFromPath(join(import.meta.dirname, "../", "/assets/deafen.png"));
const undeafenIcon = nativeImage.createFromPath(join(import.meta.dirname, "../", "/assets/deafen-off.png"));

const disconnectIcon = nativeImage.createFromPath(join(import.meta.dirname, "../", "/assets/disconnect.png"));

const tempPath = app.getPath("temp");
export function setVoiceState(muteState: boolean, deafenState: boolean) {
    console.log("[Touchbar] Setting voice state");

    mute.icon = muteState ? muteIcon : unmuteIcon;
    deafen.icon = deafenState ? deafenIcon : undeafenIcon;
}

export function importGuilds(array: Array<string>) {
    console.log(tempPath);
    console.log("[Touchbar] Importing guild icons");
    if (!existsSync(join(tempPath, "/legcordGuilds/"))) {
        mkdirSync(join(tempPath, "/legcordGuilds/"), { recursive: true });
    }
    array.forEach(async (guild) => {
        const [guildID, guildIcon] = guild.split("/");
        const image = await fetch(`https://cdn.discordapp.com/icons/${guildID}/${guildIcon}.png`);
        const buffer = Buffer.from(await image.arrayBuffer());
        writeFileSync(join(tempPath, `/legcordGuilds/${guildID}.png`), buffer);
    });
    refreshGuilds();
}

function refreshGuilds() {
    const guildsPath = join(tempPath, "/legcordGuilds/");
    const guildFiles = readdirSync(guildsPath);
    guildFiles.forEach((file) => {
        guildItems.push(
            new TouchBarButton({
                icon: nativeImage.createFromPath(join(guildsPath, `/${file}`)).resize({ height: 32 }),
                accessibilityLabel: file.replace(".png", ""), // click event doesn't work so we use to passthrough the guild ID
            }),
        );
    });
}

const mute = new TouchBarButton({
    icon: muteIcon,
    click: () => {
        muteToggle();
    },
});

const deafen = new TouchBarButton({
    icon: muteIcon,
    click: () => {
        deafenToggle();
    },
});

const disconnect = new TouchBarButton({
    icon: disconnectIcon,
    backgroundColor: "#df4e4b",
    click: () => {
        leaveCall();
    },
});

export const voiceTouchBar = new TouchBar({
    items: [mute, new TouchBarSpacer({ size: "small" }), deafen, new TouchBarSpacer({ size: "large" }), disconnect],
});

export const mainTouchBar = new TouchBar({
    items: [new TouchBarPopover({ label: "Servers", showCloseButton: true, items: scrollableList })],
});
