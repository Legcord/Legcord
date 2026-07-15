# Clipboard Fallback Plugin

Fixes Discord in-page copy actions in Legcord by patching `navigator.clipboard.writeText` in the renderer and falling back to `document.execCommand("copy")`.

This can help when actions like **Copy User ID**, **Copy Message ID**, or **Copy Message Link** leave the clipboard unchanged and logs include messages such as:

```text
Unable to determine render window for element [object HTMLDocument]
```

## Install

Copy this folder to your Legcord runtime plugins directory:

```text
<userData>/plugins/clipboard-fallback
```

Then restart Legcord and enable **Clipboard Fallback** in the Plugins settings page.
