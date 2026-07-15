# Legcord Clipboard Fallback Plugin

Fixes Discord in-page copy actions in Legcord, including:

- Copy User ID
- Copy Message ID
- Copy Message Link
- Other Discord menu actions that call `navigator.clipboard.writeText(...)`

## Why this exists

In affected Legcord/Electron environments, Discord's web UI calls:

```js
navigator.clipboard.writeText(text)
```

but Chromium rejects it, commonly with errors like:

```text
NotAllowedError: Failed to execute 'writeText' on 'Clipboard': Document is not focused.
```

or Legcord logs:

```text
Unable to determine render window for element [object HTMLDocument]
```

This plugin patches `navigator.clipboard.writeText` in the Discord page and falls back to a selection-based `document.execCommand("copy")` copy path.

## Known limitation

Legcord's native **Copy Image** context-menu action does not go through `navigator.clipboard.writeText` or `navigator.clipboard.write` in the page. It is handled by Electron's main-process context menu (`webContents.copyImageAt(...)`), so a renderer/custom-bundle plugin cannot reliably fix image copying. That needs a Legcord main-process fix or a filesystem plugin with main/preload access on newer Legcord versions.

## Install on Legcord versions with filesystem plugins

1. Open the Legcord plugins folder:

   ```text
   ~/Library/Application Support/legcord/plugins
   ```

2. Create this folder:

   ```text
   clipboard-fallback
   ```

3. Copy these files into it:

   ```text
   manifest.json
   renderer.js
   ```

4. Restart Legcord.
5. Enable **Clipboard Fallback** in Legcord's plugin settings.

## Older Legcord workaround: custom bundle

If your Legcord version does not have filesystem plugins yet, copy `custom-bundle.js` into:

```text
~/Library/Application Support/legcord/custom.js
```

Do **not** use `renderer.js` as `custom.js`; `renderer.js` is the filesystem-plugin entry and expects Legcord's plugin loader to provide `module.exports`.

and add `"custom"` to the `mods` array in:

```text
~/Library/Application Support/legcord/storage/settings.json
```

Example:

```json
"mods": ["equicord", "custom"]
```

Then restart Legcord.
