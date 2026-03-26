import { Show } from "solid-js";
import type { Settings } from "../../../@types/settings.js";
import { AboutPopup } from "../components/AboutPopup.jsx";
import { BackupSection } from "../components/BackupSection.jsx";
import { DropdownItem } from "../components/DropdownItem.jsx";
import bannerClasses from "../components/SupportBanner.module.css";
import { TextBoxItem } from "../components/TextBoxItem.jsx";
import { InfoIcon } from "../components/icons/InfoIcon.jsx";
import { setConfig, toggleMod } from "../settings.js";
import classes from "./SettingsPage.module.css";

const {
    plugin: { store },
    ui: { SwitchItem, Header, HeaderTags, Button, ButtonSizes, openModal },
} = shelter;

const settings = store.settings as Settings;
const noBundleUpdates = () => {
    const value = settings.noBundleUpdates;
    if (Array.isArray(value)) return value;
    return value ? ["shelter", "vencord", "equicord", "custom"] : [];
};

function openAboutModal() {
    openModal((close: () => void) => <AboutPopup close={close} />);
}

function dismissSupportBanner() {
    setConfig("supportBannerDismissed", true);
}

export function SettingsPage() {
    return (
        <>
            {/* Support Banner */}
            <Show when={!settings.supportBannerDismissed}>
                <div class={bannerClasses.supportBanner}>
                    <button
                        type="button"
                        class={bannerClasses.infoButton}
                        onClick={openAboutModal}
                        title="About Legcord"
                    >
                        <InfoIcon />
                    </button>
                    <div class={bannerClasses.supportBannerContent}>
                        <h3>Support the Project</h3>
                        <p>
                            Help us continue developing Legcord by making a donation. Your support keeps the project
                            alive and allows us to add new features.
                        </p>
                        <Button
                            size={ButtonSizes.MAX}
                            class={bannerClasses.donateButton}
                            onClick={() => window.open("https://github.com/sponsors/smartfrigde", "_blank")}
                        >
                            Donate
                        </Button>
                    </div>
                    <button
                        type="button"
                        class={bannerClasses.dismissButton}
                        onClick={dismissSupportBanner}
                        title="Dismiss this banner"
                    >
                        Dismiss
                    </button>
                </div>
            </Show>

            <BackupSection />
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
                note={store.i18n["settings-extendedPluginAbilities-desc"]}
                value={settings.extendedPluginAbilities}
                onChange={(e: boolean) => setConfig("extendedPluginAbilities", e)}
            >
                {store.i18n["settings-extendedPluginAbilities"]}
            </SwitchItem>
            <DropdownItem
                value={settings.windowStyle}
                onChange={(v) => setConfig("windowStyle", v as Settings["windowStyle"], true)}
                title={store.i18n["settings-theme"]}
                note={store.i18n["settings-theme-desc"]}
                link="https://github.com/Legcord/Legcord/wiki/Settings-%5Bwip%5D#legcord-theme"
                options={[
                    { label: store.i18n["settings-theme-default"], value: "default" },
                    { label: store.i18n["settings-theme-native"], value: "native" },
                    { label: store.i18n["settings-theme-overlay"], value: "overlay" },
                    { label: store.i18n["settings-theme-legacy"], value: "legacy" },
                ]}
            />
            <DropdownItem
                value={store.settings.transparency}
                onChange={(v) => setConfig("transparency", v as Settings["transparency"], true)}
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
                options={[
                    {
                        label: store.i18n["settings-transparency-universal"],
                        value: "universal",
                    },
                    ...(window.legcord.platform === "win32" || window.legcord.platform === "darwin"
                        ? [
                              {
                                  label: store.i18n["settings-transparency-modern"],
                                  value: "modern",
                              },
                          ]
                        : []),
                    { label: store.i18n["settings-none"], value: "none" },
                ]}
            />
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
                onChange={(v) => setConfig("tray", v as Settings["tray"], true)}
                title={store.i18n["settings-trayIcon"]}
                note={store.i18n["settings-trayIcon-desc"]}
                options={[
                    { label: store.i18n["settings-trayIcon-dynamic"], value: "dynamic" },
                    {
                        label: store.i18n["settings-trayIcon-disabled"],
                        value: "disabled",
                    },
                    { label: store.i18n["settings-trayIcon-normal"], value: "dsc-tray" },
                    {
                        label: store.i18n["settings-trayIcon-classic"],
                        value: "clsc-dsc-tray",
                    },
                    {
                        label: store.i18n["settings-trayIcon-colored-plug"],
                        value: "ac_plug_colored",
                    },
                    {
                        label: store.i18n["settings-trayIcon-white-plug"],
                        value: "ac_white_plug",
                    },
                    {
                        label: store.i18n["settings-trayIcon-white-plug-alt"],
                        value: "ac_white_plug_hollow",
                    },
                    {
                        label: store.i18n["settings-trayIcon-black-plug"],
                        value: "ac_black_plug",
                    },
                    {
                        label: store.i18n["settings-trayIcon-black-plug-alt"],
                        value: "ac_black_plug_hollow",
                    },
                ]}
            />
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
                onChange={(v) => setConfig("channel", v as Settings["channel"], true)}
                title={store.i18n["settings-channel"]}
                note={store.i18n["settings-channel-desc"]}
                link="https://support.discord.com/hc/en-us/articles/360035675191-Discord-Testing-Clients"
                options={[
                    { label: store.i18n["settings-channel-stable"], value: "stable" },
                    { label: store.i18n["settings-channel-canary"], value: "canary" },
                    { label: store.i18n["settings-channel-ptb"], value: "ptb" },
                ]}
            />
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
                {store.i18n["settings-category-powerManagement"]}
            </Header>
            <DropdownItem
                value={settings.performanceMode}
                onChange={(v) => setConfig("performanceMode", v as Settings["performanceMode"], true)}
                title={store.i18n["settings-prfmMode"]}
                note={store.i18n["settings-prfmMode-desc"]}
                link="https://github.com/Legcord/Legcord/blob/dev/src/common/flags.ts"
                options={[
                    { label: store.i18n["settings-prfmMode-dynamic"], value: "dynamic" },
                    {
                        label: store.i18n["settings-prfmMode-performance"],
                        value: "performance",
                    },
                    { label: store.i18n["settings-prfmMode-battery"], value: "battery" },
                    { label: store.i18n["settings-none"], value: "none" },
                ]}
            />
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
                {store.i18n["settings-category-arrpc"]}
            </Header>
            <SwitchItem
                note={store.i18n["settings-invitewebsocket-desc"]}
                value={settings.inviteWebsocket}
                onChange={(e: boolean) => setConfig("inviteWebsocket", e, true)}
            >
                {store.i18n["settings-invitewebsocket"]}
            </SwitchItem>
            <Show when={settings.inviteWebsocket === true}>
                <SwitchItem
                    note={store.i18n["settings-processScanning-desc"]}
                    value={settings.processScanning}
                    onChange={(e: boolean) => setConfig("processScanning", e, true)}
                >
                    {store.i18n["settings-processScanning"]}
                </SwitchItem>
                <Show when={window.legcord.platform === "win32"}>
                    <SwitchItem
                        note={store.i18n["settings-windowsLegacyScanning-desc"]}
                        value={settings.windowsLegacyScanning}
                        onChange={(e: boolean) => setConfig("windowsLegacyScanning", e, true)}
                    >
                        {store.i18n["settings-windowsLegacyScanning"]}
                    </SwitchItem>
                </Show>
                <TextBoxItem
                    title={store.i18n["settings-scanInterval"]}
                    note={store.i18n["settings-scanInterval-desc"]}
                    value={Number(settings.scanInterval).toString()}
                    onInput={(v: string) => setConfig("scanInterval", Number(v))}
                />
            </Show>
            <Header class={classes.category} tag={HeaderTags.H5}>
                {store.i18n["settings-category-debug"]}
            </Header>
            <Show when={window.legcord.platform === "linux"}>
                <SwitchItem
                    note={store.i18n["settings-venmic-deviceSelect-desc"]}
                    value={settings.audio.deviceSelect}
                    onChange={(e: boolean) => {
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
                    onChange={(e: boolean) => {
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
                    onChange={(e: boolean) => {
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
                    onChange={(e: boolean) => {
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
                    onChange={(e: boolean) => {
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
                    onChange={(e: boolean) => {
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
                    onChange={(e: boolean) => {
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
                    onChange={(e: boolean) => {
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
                onChange={(v) => {
                    const audioSettings = structuredClone({ ...settings.audio });
                    audioSettings.loopbackType = v as Settings["audio"]["loopbackType"];
                    setConfig("audio", audioSettings);
                }}
                title={store.i18n["settings-audio"]}
                note={store.i18n["settings-audio-desc"]}
                link="https://www.electronjs.org/docs/latest/api/session#sessetdisplaymediarequesthandlerhandler-opts"
                options={[
                    { label: store.i18n["settings-audio-loopback"], value: "loopback" },
                    {
                        label: store.i18n["settings-audio-loopbackWithMute"],
                        value: "loopbackWithMute",
                    },
                ]}
            />
            <SwitchItem
                note={store.i18n["settings-hardwareAcceleration-desc"]}
                value={settings.hardwareAcceleration}
                onChange={(e: boolean) => setConfig("hardwareAcceleration", e, true)}
            >
                {store.i18n["settings-hardwareAcceleration"]}
            </SwitchItem>
            <Show when={window.legcord.platform === "linux"}>
                <SwitchItem
                    note={store.i18n["settings-vaapi-desc"]}
                    value={settings.vaapi}
                    onChange={(e: boolean) => setConfig("vaapi", e, true)}
                >
                    {store.i18n["settings-vaapi"]}
                </SwitchItem>
            </Show>
            <SwitchItem
                note={store.i18n["settings-automaticClientUpdates-desc"]}
                value={settings.automaticUpdates}
                onChange={(e: boolean) => setConfig("automaticUpdates", e, true)}
            >
                {store.i18n["settings-automaticClientUpdates"]}
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
            <Header class={classes.category} tag={HeaderTags.H5}>
                {store.i18n["settings-noBundleUpdates"]}
            </Header>
            <SwitchItem
                note={store.i18n["settings-noBundleUpdates-desc"]}
                value={noBundleUpdates().includes("shelter")}
                onChange={(e: boolean) => {
                    const next = new Set(noBundleUpdates());
                    if (e) next.add("shelter");
                    else next.delete("shelter");
                    setConfig("noBundleUpdates", Array.from(next) as Settings["noBundleUpdates"], true);
                }}
            >
                {store.i18n["settings-mod-shelter"]}
            </SwitchItem>
            <Show when={settings.mods.includes("vencord")}>
                <SwitchItem
                    value={noBundleUpdates().includes("vencord")}
                    onChange={(e: boolean) => {
                        const next = new Set(noBundleUpdates());
                        if (e) next.add("vencord");
                        else next.delete("vencord");
                        setConfig("noBundleUpdates", Array.from(next) as Settings["noBundleUpdates"], true);
                    }}
                >
                    Vencord
                </SwitchItem>
            </Show>
            <Show when={settings.mods.includes("equicord")}>
                <SwitchItem
                    value={noBundleUpdates().includes("equicord")}
                    onChange={(e: boolean) => {
                        const next = new Set(noBundleUpdates());
                        if (e) next.add("equicord");
                        else next.delete("equicord");
                        setConfig("noBundleUpdates", Array.from(next) as Settings["noBundleUpdates"], true);
                    }}
                >
                    Equicord
                </SwitchItem>
            </Show>
            <Show when={settings.mods.includes("custom")}>
                <SwitchItem
                    value={noBundleUpdates().includes("custom")}
                    onChange={(e: boolean) => {
                        const next = new Set(noBundleUpdates());
                        if (e) next.add("custom");
                        else next.delete("custom");
                        setConfig("noBundleUpdates", Array.from(next) as Settings["noBundleUpdates"], true);
                    }}
                >
                    {store.i18n["settings-mod-custom"]}
                </SwitchItem>
            </Show>
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
