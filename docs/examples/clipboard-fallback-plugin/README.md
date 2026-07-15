# Legcord Clipboard Fallback Plugin

Fixes Discord in-page copy actions in Legcord, including:

- Copy User ID
- Copy Message ID
- Copy Message Link
- Copy Image / rich clipboard payloads where Discord uses `navigator.clipboard.write(...)`
- Other Discord menu actions that call `navigator.clipboard.writeText(...)` or `navigator.clipboard.write(...)`

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

This plugin patches `navigator.clipboard.writeText` and `navigator.clipboard.write` in the Discord page and falls back to a selection-based `document.execCommand("copy")` copy path.

For image payloads, it converts the image Blob into a data URL, places it in a temporary off-screen editable element, selects it, and copies that selection. This is a browser fallback, so native Clipboard API image writes are still preferable when they work, but it covers the Legcord failure mode where Discord's Clipboard API call is blocked.

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

If your Legcord version does not have filesystem plugins yet, copy `renderer.js` into:

```text
~/Library/Application Support/legcord/custom.js
```

and add `"custom"` to the `mods` array in:

```text
~/Library/Application Support/legcord/storage/settings.json
```

Example:

```json
"mods": ["equicord", "custom"]
```

Then restart Legcord.
