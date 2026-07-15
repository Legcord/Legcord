# Legcord Plugin System

Legcord now supports filesystem plugins loaded from:

`<userData>/plugins/<plugin-id>/`

Each plugin can provide separate runtime entries for:

- `main` (Electron main process)
- `preload` (Legcord preload context)
- `renderer` (Discord page context)

## Manifest

Create a `manifest.json` in your plugin folder:

```json
{
    "id": "example-plugin",
    "name": "Example Plugin",
    "version": "1.0.0",
    "description": "Example plugin with all three targets",
    "author": "you",
    "compatibleVersions": ["1.3.x"],
    "main": "main.js",
    "preload": "preload.js",
    "renderer": "renderer.js"
}
```

Required fields:

- `id`
- `name`
- `version`

Optional fields:

- `description`
- `author`
- `compatibleVersions`
- `main`
- `preload`
- `renderer`

`compatibleVersions` supports exact versions and `x` wildcard prefixes:

- `"1.3.0"` (exact)
- `"1.3.x"` (any patch in `1.3`)
- `"*"` (all versions)

If the running Legcord version does not match, the plugin is marked incompatible and cannot be enabled/loaded.
Plugins are disabled by default until explicitly enabled in the Plugins settings page.

## Lifecycle

Main and preload entries can export either:

- `activate(api)` named export
- default export function

Renderer entries run as plain script files and can expose:

- `module.exports.activate = (api) => { ... }`
- `module.exports.default = (api) => { ... }`
- `globalThis.activatePlugin = (api) => { ... }`

## Plugin Control API

From `window.legcord.plugins`:

- `list()`
- `setEnabled(id, enabled)`
- `reload(id)`

Main-process entries are enabled/disabled live. Preload/renderer entries are loaded on startup/navigation and will reflect enable state on next load.

## Patcher API (Spitroast-style)

Plugin APIs include:

- `api.patcher.before(name, parent, callback, oneTime?)`
- `api.patcher.after(name, parent, callback, oneTime?)`
- `api.patcher.instead(name, parent, callback, oneTime?)`

Callbacks use the same semantics as Spitroast (`args` mutation/replacement, return value replacement, instead chaining).  
The return value is an `unpatch()` function.

### Example

```js
export function activate(api) {
    const unpatch = api.patcher.before("fetch", window, (args) => {
        api.logger.log("fetch called with", args[0]);
    });

    api.onCleanup(() => {
        unpatch();
    });
}
```

## Notes

- Plugin enable state is stored in config under `pluginStates`.
- Plugin folders are scanned from disk at startup.
- Invalid manifests or missing entry files are skipped safely.

## Full Example Plugin

A complete example is available at:

- `docs/examples/hello-plugin/manifest.json`
- `docs/examples/hello-plugin/main.js`
- `docs/examples/hello-plugin/preload.js`
- `docs/examples/hello-plugin/renderer.js`

A practical renderer-only workaround plugin is also available at:

- `docs/examples/clipboard-fallback-plugin/manifest.json`
- `docs/examples/clipboard-fallback-plugin/renderer.js`

To test it:

1. Copy `docs/examples/hello-plugin` into your runtime plugins directory:
   - `<userData>/plugins/hello-plugin`
2. Restart Legcord or use the Plugins settings page:
   - enable/disable
   - reload
3. Open DevTools and watch for `[Plugin:hello-plugin]` logs.
