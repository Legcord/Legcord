import { Show } from "solid-js";
import type { Settings } from "../../../@types/settings.js";
import { DropdownItem } from "../components/DropdownItem.jsx";
import { setConfig, toggleMod } from "../settings.js";
import classes from "./SettingsPage.module.css";

const {
    plugin: { store },
    ui: { SwitchItem, Header, Divider, HeaderTags, Button, ButtonSizes },
} = shelter;

const settings = store.settings as Settings;

export function SettingsPage() {
    return (
        <>
            <Header tag={HeaderTags.H1}>Settings</Header>
            <Divider mt mb />
            <Header class={classes.category} tag={HeaderTags.H5}>
                {store.i18n["settings-category-mods"]}
            </Header>
            <SwitchItem
                note={store.i18n["settings-csp-desc"]}
                value={settings.legcordCSP}
                onChange={(e: boolean) => setConfig("legcordCSP", e, true)}
            >
                Legcord CSP
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-mod-vencord"]}
                value={settings.mods.includes("vencord")}
                onChange={(e: boolean) => toggleMod("vencord", e)}
            >
                Vencord
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-mod-equicord"]}
                value={settings.mods.includes("equicord")}
                onChange={(e: boolean) => toggleMod("equicord", e)}
            >
                Equicord
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-invitewebsocket-desc"]}
                value={store.settings.inviteWebsocket}
                onChange={(e: boolean) => setConfig("inviteWebsocket", e, true)}
            >
                {store.i18n["settings-invitewebsocket"]}
            </SwitchItem>
            <Header class={classes.category} tag={HeaderTags.H5}>
                {store.i18n["settings-category-lookAndFeel"]}
            </Header>
            <DropdownItem
                value={store.settings.windowStyle}
                onChange={(e) =>
                    setConfig("windowStyle", (e.target as HTMLInputElement).value as Settings["windowStyle"], true)
                }
                title={store.i18n["settings-theme"]}
                note={store.i18n["settings-theme-desc"]}
                link="https://github.com/Legcord/Legcord/wiki/Settings-%5Bwip%5D#legcord-theme"
            >
                <option value="default">{store.i18n["settings-theme-default"]}</option>
                <option value="native">{store.i18n["settings-theme-native"]}</option>
                <Show when={window.legcord.platform === "win32"}>
                    <option value="overlay">{store.i18n["settings-theme-overlay"]}</option>
                </Show>
            </DropdownItem>
            <DropdownItem
                value={store.settings.transparency}
                onChange={(e) =>
                    setConfig("transparency", (e.target as HTMLInputElement).value as Settings["transparency"], true)
                }
                title={store.i18n["settings-transparency"]}
                note={store.i18n["settings-transparency-desc"]}
                link="https://github.com/Legcord/Legcord/wiki/Transparency-options"
            >
                <option value="universal">{store.i18n["settings-transparency-universal"]}</option>
                <Show when={window.legcord.platform === "win32"}>
                    <option value="modern">{store.i18n["settings-transparency-modern"]}</option>
                </Show>
                <option value="none">{store.i18n["settings-none"]}</option>
            </DropdownItem>
            <DropdownItem
                value={store.settings.trayIcon}
                onChange={(e) =>
                    setConfig("trayIcon", (e.target as HTMLInputElement).value as Settings["trayIcon"], true)
                }
                title={store.i18n["settings-trayIcon"]}
                note={store.i18n["settings-trayIcon-desc"]}
            >
                <option value="dynamic">{store.i18n["settings-trayIcon-dynamic"]}</option>
                <option value="dsc-tray">{store.i18n["settings-trayIcon-normal"]}</option>
                <option value="clsc-dsc-tray">{store.i18n["settings-trayIcon-classic"]}</option>
                <option value="ac_plug_colored">{store.i18n["settings-trayIcon-colored-plug"]}</option>
                <option value="ac_white_plug">{store.i18n["settings-trayIcon-white-plug"]}</option>
                <option value="ac_white_plug_hollow">{store.i18n["settings-trayIcon-white-plug-alt"]}</option>
                <option value="ac_black_plug">{store.i18n["settings-trayIcon-black-plug"]}</option>
                <option value="ac_black_plug_hollow">{store.i18n["settings-trayIcon-black-plug-alt"]}</option>
            </DropdownItem>
            <SwitchItem
                note={store.i18n["settings-skipSplash-desc"]}
                value={store.settings.skipSplash}
                onChange={(e: boolean) => setConfig("skipSplash", e)}
            >
                {store.i18n["settings-skipSplash"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-mobileMode-desc"]}
                value={store.settings.mobileMode}
                onChange={(e: boolean) => setConfig("mobileMode", e, true)}
            >
                {store.i18n["settings-mobileMode"]}
            </SwitchItem>
            <Header class={classes.category} tag={HeaderTags.H5}>
                Behaviour
            </Header>
            <DropdownItem
                value={store.settings.channel}
                onChange={(e) =>
                    setConfig("channel", (e.target as HTMLInputElement).value as Settings["channel"], true)
                }
                title={store.i18n["settings-channel"]}
                note={store.i18n["settings-channel-desc"]}
                link="https://support.discord.com/hc/en-us/articles/360035675191-Discord-Testing-Clients"
            >
                <option value="stable">Stable</option>
                <option value="canary">Canary</option>
                <option value="ptb">PTB</option>
            </DropdownItem>
            <DropdownItem
                value={store.settings.performanceMode}
                onChange={(e) => setConfig("performanceMode", (e.target as HTMLInputElement).value, true)}
                title={store.i18n["settings-prfmMode"]}
                note={store.i18n["settings-prfmMode-desc"]}
                link="https://github.com/Legcord/Legcord/blob/dev/src/common/flags.ts"
            >
                <option value="performance">{store.i18n["settings-prfmMode-performance"]}</option>
                <option value="battery">{store.i18n["settings-prfmMode-battery"]}</option>
                <option value="vaapi">{store.i18n["settings-prfmMode-vaapi"]}</option>
                <option value="none">{store.i18n["settings-none"]}</option>
            </DropdownItem>
            <SwitchItem
                note={store.i18n["settings-MultiInstance-desc"]}
                value={store.settings.multiInstance}
                onChange={(e: boolean) => setConfig("multiInstance", e)}
            >
                {store.i18n["settings-MultiInstance"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-mintoTray-desc"]}
                value={store.settings.minimizeToTray}
                onChange={(e: boolean) => setConfig("minimizeToTray", e)}
            >
                {store.i18n["settings-mintoTray"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-tray-desc"]}
                value={store.settings.tray}
                onChange={(e: boolean) => setConfig("tray", e, true)}
            >
                {store.i18n["settings-tray"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-startMinimized-desc"]}
                value={store.settings.startMinimized}
                onChange={(e: boolean) => setConfig("startMinimized", e)}
            >
                {store.i18n["settings-startMinimized"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-smoothScroll-desc"]}
                value={store.settings.smoothScroll}
                onChange={(e: boolean) => setConfig("smoothScroll", e, true)}
            >
                {store.i18n["settings-smoothScroll"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-autoScroll-desc"]}
                value={store.settings.autoScroll}
                onChange={(e: boolean) => setConfig("autoScroll", e, true)}
            >
                {store.i18n["settings-autoScroll"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-spellcheck-desc"]}
                value={store.settings.spellcheck}
                onChange={(e: boolean) => setConfig("spellcheck", e, true)}
            >
                {store.i18n["settings-spellcheck"]}
            </SwitchItem>
            <Header class={classes.category} tag={HeaderTags.H5}>
                {store.i18n["settings-category-legacy"]}
            </Header>
            <SwitchItem
                note={store.i18n["settings-useLegacyCapturer-desc"]}
                value={store.settings.useLegacyCapturer}
                onChange={(e: boolean) => setConfig("useLegacyCapturer", e, true)}
            >
                {store.i18n["settings-useLegacyCapturer"]}
            </SwitchItem>
            <Header class={classes.category} tag={HeaderTags.H5}>
                {store.i18n["settings-category-debug"]}
            </Header>
            <DropdownItem
                value={store.settings.audio}
                onChange={(e) => setConfig("audio", (e.target as HTMLInputElement).value as Settings["audio"])}
                title={store.i18n["settings-audio"]}
                note={store.i18n["settings-audio-desc"]}
                link="https://www.electronjs.org/docs/latest/api/session#sessetdisplaymediarequesthandlerhandler-opts"
            >
                <option value="loopback">Loopback</option>
                <option value="loopbackWithMute">Loopback with mute</option>
            </DropdownItem>
            <SwitchItem
                note={store.i18n["settings-hardwareAcceleration-desc"]}
                value={store.settings.hardwareAcceleration}
                onChange={(e: boolean) => setConfig("hardwareAcceleration", e, true)}
            >
                {store.i18n["settings-hardwareAcceleration"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-disableHttpCache-desc"]}
                value={store.settings.disableHttpCache}
                onChange={(e: boolean) => setConfig("disableHttpCache", e, true)}
            >
                {store.i18n["settings-disableHttpCache"]}
            </SwitchItem>
            <Button size={ButtonSizes.MAX} onClick={window.legcord.settings.openStorageFolder}>
                {store.i18n["settings-storageFolder"]}
            </Button>
            <br />
            <Button size={ButtonSizes.MAX} onClick={window.legcord.settings.copyDebugInfo}>
                {store.i18n["settings-copyDebugInfo"]}
            </Button>
            <br />
            <Button size={ButtonSizes.MAX} onClick={window.legcord.settings.copyGPUInfo}>
                {store.i18n["settings-copyGPUInfo"]}
            </Button>
            <br />
            <Button size={ButtonSizes.MAX} onClick={() => setConfig("modCache", {} as Settings["modCache"])}>
                {store.i18n["settings-clearClientModCache"]}
            </Button>
        </>
    );
}
