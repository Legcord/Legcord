# Channel Popout

Right-click a channel in the server or DM list and choose **Open in New Window**. The popout is a separate window on the same login. The server list, channel list, and member list are hidden so the chat fills the window. Opening the same channel again focuses the existing popout.

Legcord sends normal `window.open` links to the system browser. This plugin marks its own channel URL and, in the main process, opens only that URL in a new window.

The popout loads Legcord's preload, so the enabled client mod, Legcord's window chrome, and enabled themes plus Quick CSS come with it. Focusing the popout picks up theme changes made after it opened.

The popout is a second Discord session on the same account. Message notifications can show twice, and the window can appear under Settings, Devices.

## Install

Copy this folder to `<userData>/plugins/channel-popout`:

- Windows: `%APPDATA%\legcord\plugins\channel-popout`
- Portable Windows: `legcord-data\plugins\channel-popout` next to the executable
- macOS: `~/Library/Application Support/legcord/plugins/channel-popout`
- Linux: `~/.config/legcord/plugins/channel-popout`

Include `manifest.json`, `main.js`, `renderer.js`, and `package.json`. Quit Legcord completely, including the tray icon, then start it again.

1. Discord settings, then Legcord Settings.
2. Turn on **Show experimental plugin menu**.
3. Open **Plugins** and enable **Channel Popout**.
