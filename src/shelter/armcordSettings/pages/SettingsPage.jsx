import {DropdownItem} from "../components/DropdownItem";
import classes from "./SettingsPage.css";
import {set} from "../settings";
const {
    plugin: {store},
    ui: {SwitchItem, Header, Divider, HeaderTags, Button, ButtonSizes}
} = shelter;

export function SettingsPage() {
    return (
        <>
            <Header tag={HeaderTags.H1}>Settings</Header>
            <Divider mt mb />
            <Header class={classes.category} tag={HeaderTags.H5}>
                Mods
            </Header>
            <SwitchItem
                note={store.i18n["settings-csp-desc"]}
                value={store.settings.armcordCSP}
                onChange={(e) => set("armcordCSP", e)}
            >
                ArmCord CSP
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-mod-vencord"]}
                value={store.vencord}
                onChange={(e) => set("vencord", e)}
            >
                Vencord
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-invitewebsocket-desc"]}
                value={store.settings.inviteWebsocket}
                onChange={(e) => set("inviteWebsocket", e)}
            >
                {store.i18n["settings-invitewebsocket"]}
            </SwitchItem>
            <Header class={classes.category} tag={HeaderTags.H5}>
                Look and feel
            </Header>
            <DropdownItem
                value={store.settings.windowStyle}
                onChange={(e) => set("windowStyle", e.target.value)}
                title={store.i18n["settings-theme"]}
                note={store.i18n["settings-theme-desc"]}
                link="https://github.com/ArmCord/ArmCord/wiki/Settings-%5Bwip%5D#armcord-theme"
            >
                <option value="default">Default (Custom)</option>
                <option value="native">Native</option>
                <option value="transparent">Transparent</option>
            </DropdownItem>
            <DropdownItem
                value={store.settings.trayIcon}
                onChange={(e) => set("trayIcon", e.target.value)}
                title={store.i18n["settings-trayIcon"]}
                note={store.i18n["settings-trayIcon-desc"]}
            >
                <option value="default">{store.i18n["settings-trayIcon-dynamic"]}</option>
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
                onChange={(e) => set("skipSplash", e)}
            >
                {store.i18n["settings-skipSplash"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-mobileMode-desc"]}
                value={store.settings.mobileMode}
                onChange={(e) => set("mobileMode", e)}
            >
                {store.i18n["settings-mobileMode"]}
            </SwitchItem>
            <Header class={classes.category} tag={HeaderTags.H5}>
                Behaviour
            </Header>
            <DropdownItem
                value={store.settings.channel}
                onChange={(e) => set("channel", e.target.value)}
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
                onChange={(e) => set("performanceMode", e.target.value)}
                title={store.i18n["settings-prfmMode"]}
                note={store.i18n["settings-prfmMode-desc"]}
                link="https://github.com/ArmCord/ArmCord/blob/dev/src/common/flags.ts"
            >
                <option value="performance">{store.i18n["settings-prfmMode-performance"]}</option>
                <option value="battery">{store.i18n["settings-prfmMode-battery"]}</option>
                <option value="vaapi">{store.i18n["settings-prfmMode-vaapi"]}</option>
                <option value="none">{store.i18n["settings-none"]}</option>
            </DropdownItem>
            <SwitchItem
                note={store.i18n["settings-MultiInstance-desc"]}
                value={store.settings.multiInstance}
                onChange={(e) => set("multiInstance", e)}
            >
                {store.i18n["settings-MultiInstance"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-mintoTray-desc"]}
                value={store.settings.minimizeToTray}
                onChange={(e) => set("minimizeToTray", e)}
            >
                {store.i18n["settings-mintoTray"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-tray-desc"]}
                value={store.settings.tray}
                onChange={(e) => set("tray", e)}
            >
                {store.i18n["settings-tray"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-startMinimized-desc"]}
                value={store.settings.startMinimized}
                onChange={(e) => set("startMinimized", e)}
            >
                {store.i18n["settings-startMinimized"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-smoothScroll-desc"]}
                value={store.settings.smoothScroll}
                onChange={(e) => set("smoothScroll", e)}
            >
                {store.i18n["settings-smoothScroll"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-autoScroll-desc"]}
                value={store.settings.autoScroll}
                onChange={(e) => set("autoScroll", e)}
            >
                {store.i18n["settings-autoScroll"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-spellcheck-desc"]}
                value={store.settings.spellcheck}
                onChange={(e) => set("spellcheck", e)}
            >
                {store.i18n["settings-spellcheck"]}
            </SwitchItem>
            <Header class={classes.category} tag={HeaderTags.H5}>
                Legacy features
            </Header>
            <SwitchItem
                note={store.i18n["settings-useLegacyCapturer-desc"]}
                value={store.settings.useLegacyCapturer}
                onChange={(e) => set("useLegacyCapturer", e)}
            >
                {store.i18n["settings-useLegacyCapturer"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-dynamicIcon-desc"]}
                value={store.settings.dynamicIcon}
                onChange={(e) => set("dynamicIcon", e)}
            >
                {store.i18n["settings-dynamicIcon"]}
            </SwitchItem>
            <Header class={classes.category} tag={HeaderTags.H5}>
                Debug options
            </Header>
            <SwitchItem
                note={store.i18n["settings-hardwareAcceleration-desc"]}
                value={store.settings.hardwareAcceleration}
                onChange={(e) => set("hardwareAcceleration", e)}
            >
                {store.i18n["settings-hardwareAcceleration"]}
            </SwitchItem>
            <SwitchItem
                note={store.i18n["settings-disableHttpCache-desc"]}
                value={store.settings.disableHttpCache}
                onChange={(e) => set("disableHttpCache", e)}
            >
                {store.i18n["settings-disableHttpCache"]}
            </SwitchItem>
            <Button size={ButtonSizes.MAX} onClick={window.armcord.settings.openStorageFolder}>
                Open storage folder
            </Button>
            <br />
            <Button size={ButtonSizes.MAX} onClick={window.armcord.settings.copyDebugInfo}>
                Copy debug info
            </Button>
            <br />
            <Button size={ButtonSizes.MAX} onClick={window.armcord.settings.copyGPUInfo}>
                Copy GPU info
            </Button>
        </>
    );
}
