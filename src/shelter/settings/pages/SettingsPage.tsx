import { Show } from "solid-js";
import type { Settings } from "../../../@types/settings.js";
import { DropdownItem } from "../components/DropdownItem.jsx";
import { HeroUpdater } from "../components/HeroUpdater.jsx";
import { TextBoxItem } from "../components/TextBoxItem.jsx";
import { setConfig, toggleMod } from "../settings.js";
import classes from "./SettingsPage.module.css";

const {
    plugin: { store },
    ui: { SwitchItem, Header, HeaderTags, Button, ButtonSizes },
} = shelter;

const settings = store.settings as Settings;

export function SettingsPage() {
    return (
        <>
            <HeroUpdater />
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
                value={settings.inviteWebsocket}
                onChange={(e: boolean) => setConfig("inviteWebsocket", e, true)}
            >
                {store.i18n["settings-invitewebsocket"]}
            </SwitchItem>
            <Header class={classes.category} tag={HeaderTags.H5}>
                {store.i18n["settings-category-lookAndFeel"]}
            </Header>
            <DropdownItem
                value={settings.windowStyle}
                onChange={(e) =>
                    setConfig("windowStyle", (e.target as HTMLInputElement).value as Settings["windowStyle"], true)
                }
                title={store.i18n["settings-theme"]}
                note={store.i18n["settings-theme-desc"]}
                link="https://github.com/Legcord/Legcord/wiki/Settings-%5Bwip%5D#legcord-theme"
            >
                <option value="default">{store.i18n["settings-theme-default"]}</option>
                <option value="native">{store.i18n["settings-theme-native"]}</option>
                <option value="overlay">{store.i18n["settings-theme-overlay"]}</option>
                <option value="legacy">Legacy</option>
            </DropdownItem>
            <DropdownItem
                value={store.settings.transparency}
                onChange={(e) =>
                    setConfig("transparency", (e.target as HTMLInputElement).value as Settings["transparency"], true)
                }
                title={store.i18n["settings-transparency"]}
                note={store.i18n["settings-transparency-desc"]}
                link="https://github.com/Legcord/Legcord/wiki/Transparency-options"
                extraItems={
                    <Show
                        when={
                            store.settings.transparency !== "none" &&
                            window.legcord.platform === "darwin" &&
                            Number.parseInt(window.legcord.osRelease) >= 25
                        }
                    >
                        <div
                            style={{
                                background: "rgba(255, 255, 210, 0.85)",
                                border: "1px solid #e6c200",
                                color: "#2d2100",
                                padding: "12px 16px",
                            }}
                        >
                            {store.i18n["settings-transparency-tahoe-warning"]}
                        </div>
                    </Show>
                }
            >
                <option value="universal">{store.i18n["settings-transparency-universal"]}</option>
                <Show when={window.legcord.platform === "win32" || window.legcord.platform === "darwin"}>
                    <option value="modern">{store.i18n["settings-transparency-modern"]}</option>
                </Show>
                <option value="none">{store.i18n["settings-none"]}</option>
            </DropdownItem>
            <Show when={settings.windowStyle === "native"}>
                <SwitchItem
                    note={store.i18n["settings-autoHideMenuBar-desc"]}
                    value={settings.autoHideMenuBar}
                    onChange={(e: boolean) => setConfig("autoHideMenuBar", e, true)}
                >
                    {store.i18n["settings-autoHideMenuBar"]}
                </SwitchItem>
            </Show>
            <Show when={window.legcord.platform === "darwin"}>
                <SwitchItem
                    note={store.i18n["settings-bounceOnPing-desc"]}
                    value={settings.bounceOnPing}
                    onChange={(e: boolean) => setConfig("bounceOnPing", e, true)}
                >
                    {store.i18n["settings-bounceOnPing"]}
                </SwitchItem>
            </Show>
            <DropdownItem
                value={settings.tray}
                onChange={(e) => setConfig("tray", (e.target as HTMLInputElement).value as Settings["tray"], true)}
                title={store.i18n["settings-trayIcon"]}
                note={store.i18n["settings-trayIcon-desc"]}
            >
                <option value="dynamic">{store.i18n["settings-trayIcon-dynamic"]}</option>
                <option value="disabled">{store.i18n["settings-trayIcon-disabled"]}</option>
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
                value={settings.skipSplash}
                onChange={(e: boolean) => setConfig("skipSplash", e)}
            >
                {store.i18n["settings-skipSplash"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-mobileMode-desc"]}
                value={settings.mobileMode}
                onChange={(e: boolean) => setConfig("mobileMode", e, true)}
            >
                {store.i18n["settings-mobileMode"]}
            </SwitchItem>
            <Header class={classes.category} tag={HeaderTags.H5}>
                Behaviour
            </Header>
            <DropdownItem
                value={settings.channel}
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
            <SwitchItem
                note={store.i18n["settings-MultiInstance-desc"]}
                value={settings.multiInstance}
                onChange={(e: boolean) => setConfig("multiInstance", e)}
            >
                {store.i18n["settings-MultiInstance"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-popoutPiP-desc"]}
                value={settings.popoutPiP}
                onChange={(e: boolean) => setConfig("popoutPiP", e)}
            >
                {store.i18n["settings-popoutPiP"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-useSystemCssEditor-desc"]}
                value={settings.useSystemCssEditor}
                onChange={(e: boolean) => setConfig("useSystemCssEditor", e)}
            >
                {store.i18n["settings-useSystemCssEditor"]}
            </SwitchItem>
            <Show when={window.legcord.platform === "darwin"}>
                <SwitchItem
                    note={store.i18n["settings-useMacSystemPicker-desc"]}
                    value={settings.useMacSystemPicker}
                    onChange={(e: boolean) => setConfig("useMacSystemPicker", e)}
                >
                    {store.i18n["settings-useMacSystemPicker"]}
                </SwitchItem>
            </Show>
            <SwitchItem
                note={store.i18n["settings-disableAutogain-desc"]}
                value={settings.disableAutogain}
                onChange={(e: boolean) => setConfig("disableAutogain", e)}
            >
                {store.i18n["settings-disableAutogain"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-mintoTray-desc"]}
                value={settings.minimizeToTray}
                onChange={(e: boolean) => setConfig("minimizeToTray", e)}
            >
                {store.i18n["settings-mintoTray"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-startMinimized-desc"]}
                value={settings.startMinimized}
                onChange={(e: boolean) => setConfig("startMinimized", e)}
            >
                {store.i18n["settings-startMinimized"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-smoothScroll-desc"]}
                value={settings.smoothScroll}
                onChange={(e: boolean) => setConfig("smoothScroll", e, true)}
            >
                {store.i18n["settings-smoothScroll"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-autoScroll-desc"]}
                value={settings.autoScroll}
                onChange={(e: boolean) => setConfig("autoScroll", e, true)}
            >
                {store.i18n["settings-autoScroll"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-spellcheck-desc"]}
                value={settings.spellcheck}
                onChange={(e: boolean) => setConfig("spellcheck", e, true)}
            >
                {store.i18n["settings-spellcheck"]}
            </SwitchItem>
            <Header class={classes.category} tag={HeaderTags.H5}>
                Power Management
            </Header>
            <DropdownItem
                value={settings.performanceMode}
                onChange={(e) =>
                    setConfig(
                        "performanceMode",
                        (e.target as HTMLInputElement).value as Settings["performanceMode"],
                        true,
                    )
                }
                title={store.i18n["settings-prfmMode"]}
                note={store.i18n["settings-prfmMode-desc"]}
                link="https://github.com/Legcord/Legcord/blob/dev/src/common/flags.ts"
            >
                <option value="dynamic">{store.i18n["settings-prfmMode-dynamic"]}</option>
                <option value="performance">{store.i18n["settings-prfmMode-performance"]}</option>
                <option value="battery">{store.i18n["settings-prfmMode-battery"]}</option>
                <option value="vaapi">{store.i18n["settings-prfmMode-vaapi"]}</option>
                <option value="none">{store.i18n["settings-none"]}</option>
            </DropdownItem>
            <SwitchItem
                note={store.i18n["settings-blockPowerSavingInVoiceChat-desc"]}
                value={settings.blockPowerSavingInVoiceChat}
                onChange={(e: boolean) => setConfig("blockPowerSavingInVoiceChat", e, true)}
            >
                {store.i18n["settings-blockPowerSavingInVoiceChat"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-sleepInBackground-desc"]}
                value={store.settings.sleepInBackground}
                onChange={(e: boolean) => setConfig("sleepInBackground", e, true)}
            >
                {store.i18n["settings-sleepInBackground"]}
            </SwitchItem>
            <Header class={classes.category} tag={HeaderTags.H5}>
                {store.i18n["settings-category-debug"]}
            </Header>
            <Show when={window.legcord.platform === "linux"}>
                <SwitchItem
                    note={store.i18n["settings-venmic-deviceSelect-desc"]}
                    value={settings.audio.deviceSelect}
                    onChange={(e) => {
                        const audioSettings = structuredClone({ ...settings.audio });
                        audioSettings.deviceSelect = e;
                        setConfig("audio", audioSettings);
                    }}
                >
                    {store.i18n["settings-venmic-deviceSelect"]}
                </SwitchItem>
                <SwitchItem
                    note={store.i18n["settings-venmic-granularSelect-desc"]}
                    value={settings.audio.granularSelect}
                    onChange={(e) => {
                        const audioSettings = structuredClone({ ...settings.audio });
                        audioSettings.granularSelect = e;
                        setConfig("audio", audioSettings);
                    }}
                >
                    {store.i18n["settings-venmic-granularSelect"]}
                </SwitchItem>
                <SwitchItem
                    note={store.i18n["settings-venmic-workaround-desc"]}
                    value={settings.audio.workaround}
                    onChange={(e) => {
                        const audioSettings = structuredClone({ ...settings.audio });
                        audioSettings.workaround = e;
                        setConfig("audio", audioSettings);
                    }}
                >
                    {store.i18n["settings-venmic-workaround"]}
                </SwitchItem>
                <SwitchItem
                    note={store.i18n["settings-venmic-ignoreVirtual-desc"]}
                    value={settings.audio.ignoreVirtual}
                    onChange={(e) => {
                        const audioSettings = structuredClone({ ...settings.audio });
                        audioSettings.ignoreVirtual = e;
                        setConfig("audio", audioSettings);
                    }}
                >
                    {store.i18n["settings-venmic-ignoreVirtual"]}
                </SwitchItem>
                <SwitchItem
                    note={store.i18n["settings-venmic-ignoreDevices-desc"]}
                    value={settings.audio.ignoreDevices}
                    onChange={(e) => {
                        const audioSettings = structuredClone({ ...settings.audio });
                        audioSettings.ignoreDevices = e;
                        setConfig("audio", audioSettings);
                    }}
                >
                    {store.i18n["settings-venmic-ignoreDevices"]}
                </SwitchItem>
                <SwitchItem
                    note={store.i18n["settings-venmic-ignoreInputMedia-desc"]}
                    value={settings.audio.ignoreInputMedia}
                    onChange={(e) => {
                        const audioSettings = structuredClone({ ...settings.audio });
                        audioSettings.ignoreInputMedia = e;
                        setConfig("audio", audioSettings);
                    }}
                >
                    {store.i18n["settings-venmic-ignoreInputMedia"]}
                </SwitchItem>
                <SwitchItem
                    note={store.i18n["settings-venmic-onlySpeakers-desc"]}
                    value={settings.audio.onlySpeakers}
                    onChange={(e) => {
                        const audioSettings = structuredClone({ ...settings.audio });
                        audioSettings.onlySpeakers = e;
                        setConfig("audio", audioSettings);
                    }}
                >
                    {store.i18n["settings-venmic-onlySpeakers"]}
                </SwitchItem>
                <SwitchItem
                    note={store.i18n["settings-venmic-onlyDefaultSpeakers-desc"]}
                    value={settings.audio.onlyDefaultSpeakers}
                    onChange={(e) => {
                        const audioSettings = structuredClone({ ...settings.audio });
                        audioSettings.onlyDefaultSpeakers = e;
                        setConfig("audio", audioSettings);
                    }}
                >
                    {store.i18n["settings-venmic-onlyDefaultSpeakers"]}
                </SwitchItem>
            </Show>
            <DropdownItem
                value={settings.audio.loopbackType}
                onChange={(e) => {
                    const audioSettings = structuredClone({ ...settings.audio });
                    audioSettings.loopbackType = (e.target as HTMLInputElement)
                        .value as Settings["audio"]["loopbackType"];
                    setConfig("audio", audioSettings);
                }}
                title={store.i18n["settings-audio"]}
                note={store.i18n["settings-audio-desc"]}
                link="https://www.electronjs.org/docs/latest/api/session#sessetdisplaymediarequesthandlerhandler-opts"
            >
                <option value="loopback">Loopback</option>
                <option value="loopbackWithMute">Loopback with mute</option>
            </DropdownItem>
            <SwitchItem
                note={store.i18n["settings-hardwareAcceleration-desc"]}
                value={settings.hardwareAcceleration}
                onChange={(e: boolean) => setConfig("hardwareAcceleration", e, true)}
            >
                {store.i18n["settings-hardwareAcceleration"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-noBundleUpdates-desc"]}
                value={settings.noBundleUpdates}
                onChange={(e: boolean) => setConfig("noBundleUpdates", e, true)}
            >
                {store.i18n["settings-noBundleUpdates"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-disableHttpCache-desc"]}
                value={settings.disableHttpCache}
                onChange={(e: boolean) => setConfig("disableHttpCache", e, true)}
            >
                {store.i18n["settings-disableHttpCache"]}
            </SwitchItem>
            <TextBoxItem
                title={store.i18n["settings-additionalArguments"]}
                note={store.i18n["settings-additionalArguments-desc"]}
                value={settings.additionalArguments}
                onInput={(v: string) => setConfig("additionalArguments", v)}
            />
            <Button size={ButtonSizes.MAX} onClick={window.legcord.settings.openCustomIconDialog}>
                {store.i18n["settings-openCustomIconDialog"]}
            </Button>
            <br />
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
