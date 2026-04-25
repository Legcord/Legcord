const { ipcRenderer, webFrame } = require("electron");
const { after, before, instead } = require("spitroast/dist/index.js");

type RuntimeEntry = {
    id: string;
    name: string;
    path: string;
    storageToken: string;
};

const cleanupMap = new Map<string, Array<() => void>>();
const runtimeBootstrapTokenPromise = ipcRenderer.invoke("plugins:register-runtime-client") as Promise<string | null>;

function addCleanup(pluginId: string, cleanup: () => void) {
    const current = cleanupMap.get(pluginId) ?? [];
    current.push(cleanup);
    cleanupMap.set(pluginId, current);
}

function clearCleanup(pluginId: string) {
    const cleanups = cleanupMap.get(pluginId);
    if (!cleanups) return;
    for (const cleanup of cleanups.splice(0)) {
        try {
            cleanup();
        } catch (error) {
            console.error(`[Plugin:${pluginId}] cleanup failed`, error);
        }
    }
}

function createApi(pluginId: string, pluginName: string, storageToken: string) {
    const loggerPrefix = `[Plugin:${pluginId}]`;
    return {
        id: pluginId,
        name: pluginName,
        logger: {
            log: (...args: unknown[]) => console.log(loggerPrefix, ...args),
            warn: (...args: unknown[]) => console.warn(loggerPrefix, ...args),
            error: (...args: unknown[]) => console.error(loggerPrefix, ...args),
        },
        patcher: {
            before: (...args: Parameters<typeof before>) => {
                const unpatch = before(...args);
                addCleanup(pluginId, unpatch);
                return unpatch;
            },
            after: (...args: Parameters<typeof after>) => {
                const unpatch = after(...args);
                addCleanup(pluginId, unpatch);
                return unpatch;
            },
            instead: (...args: Parameters<typeof instead>) => {
                const unpatch = instead(...args);
                addCleanup(pluginId, unpatch);
                return unpatch;
            },
        },
        fs: {
            writeFile: (relativePath: string, data: string) =>
                ipcRenderer.invoke("pluginWriteFile", storageToken, relativePath, data) as Promise<
                    { ok: true } | { ok: false; error: string }
                >,
            readFile: (relativePath: string) =>
                ipcRenderer.invoke("pluginReadFile", storageToken, relativePath) as Promise<
                    { ok: true; data: string } | { ok: false; error: string }
                >,
        },
        onCleanup: (cleanup: () => void) => addCleanup(pluginId, cleanup),
    };
}

async function executePreloadPluginSource(pluginId: string, source: string, api: ReturnType<typeof createApi>) {
    const runner = new Function(
        "api",
        `
const mod = { exports: {} };
const module = mod;
const exports = mod.exports;
${source}
const activate = mod.exports.activate ?? mod.exports.default ?? globalThis.activatePlugin;
if (typeof activate === "function") {
  return activate(api);
}
`,
    ) as (api: ReturnType<typeof createApi>) => unknown;
    await Promise.resolve(runner(api));
}

async function loadPreloadPlugins() {
    const runtimeBootstrapToken = await runtimeBootstrapTokenPromise;
    if (!runtimeBootstrapToken) {
        console.error("[Plugin Runtime] Failed to register preload runtime client");
        return;
    }
    const entries = (await ipcRenderer.invoke(
        "plugins:get-runtime-entries",
        runtimeBootstrapToken,
        "preload",
    )) as RuntimeEntry[];
    for (const entry of entries) {
        clearCleanup(entry.id);
        try {
            const source = (await ipcRenderer.invoke(
                "plugins:get-runtime-script",
                runtimeBootstrapToken,
                entry.id,
                "preload",
            )) as string | null;
            if (!source) continue;
            await executePreloadPluginSource(entry.id, source, createApi(entry.id, entry.name, entry.storageToken));
        } catch (error) {
            console.error(`[Plugin:${entry.id}] preload entry failed`, error);
        }
    }
}

function getRendererBootstrap(pluginId: string, pluginName: string, source: string, storageToken: string) {
    const encodedPluginId = JSON.stringify(pluginId);
    const encodedPluginName = JSON.stringify(pluginName);
    const encodedStorageToken = JSON.stringify(storageToken);
    return `
(() => {
  const g = globalThis;
  const runtime = g.__legcordPluginRuntime;
  if (!runtime) throw new Error("Legcord plugin runtime bridge unavailable");
  const stores = g.__legcordPluginPatches ?? (g.__legcordPluginPatches = new WeakMap());
  const unpatchAll = () => { g.__legcordPluginPatches = new WeakMap(); };
  const patch = (type, name, parent, callback, oneTime = false) => {
    if (!parent || typeof parent[name] !== "function") throw new Error(\`Cannot patch \${String(name)}\`);
    const original = parent[name];
    let bucket = stores.get(original);
    if (!bucket) {
      bucket = { o: original, b: new Map(), i: new Map(), a: new Map(), c: [] };
      const proxy = new Proxy(original, {
        apply(_target, thisArg, argArray) {
          let args = [...argArray];
          for (const hook of bucket.b.values()) {
            const next = hook.call(thisArg, args);
            if (Array.isArray(next)) args = next;
          }
          const callOriginal = (...inner) => Reflect.apply(original, thisArg, inner);
          let ret = [...bucket.i.values()].reduceRight((prev, cur) => (...inner) => cur.call(thisArg, inner, prev), callOriginal)(...args);
          for (const hook of bucket.a.values()) ret = hook.call(thisArg, args, ret) ?? ret;
          for (const cleanup of bucket.c) cleanup();
          bucket.c.length = 0;
          return ret;
        }
      });
      stores.set(proxy, bucket);
      parent[name] = proxy;
      bucket.proxy = proxy;
      bucket.name = name;
      bucket.parent = parent;
    }
    const hookId = Symbol("hook");
    const remove = () => {
      const map = type === "b" ? bucket.b : type === "i" ? bucket.i : bucket.a;
      if (!map.delete(hookId)) return false;
      if (bucket.b.size || bucket.i.size || bucket.a.size) return true;
      bucket.parent[bucket.name] = bucket.o;
      stores.delete(bucket.proxy);
      return true;
    };
    if (oneTime) bucket.c.push(remove);
    (type === "b" ? bucket.b : type === "i" ? bucket.i : bucket.a).set(hookId, callback);
    return remove;
  };
  const api = {
        id: ${encodedPluginId},
        name: ${encodedPluginName},
    logger: {
            log: (...args) => console.log("[Plugin:${pluginId}]", ...args),
            warn: (...args) => console.warn("[Plugin:${pluginId}]", ...args),
            error: (...args) => console.error("[Plugin:${pluginId}]", ...args),
    },
    patcher: {
      before: (name, parent, cb, once) => patch("b", name, parent, cb, once),
      instead: (name, parent, cb, once) => patch("i", name, parent, cb, once),
      after: (name, parent, cb, once) => patch("a", name, parent, cb, once),
      unpatchAll
        },
        fs: {
            writeFile: (relativePath, data) => runtime.writeFile(${encodedStorageToken}, relativePath, data),
            readFile: (relativePath) => runtime.readFile(${encodedStorageToken}, relativePath),
    }
  };
  const mod = { exports: {} };
  const module = mod;
  const exports = mod.exports;
  ${source}
  const activate = mod.exports.activate ?? mod.exports.default ?? g.activatePlugin;
  if (typeof activate === "function") activate(api);
})();
//# sourceURL=legcord-plugin-renderer-${pluginId}.js
`;
}

async function loadRendererPlugins() {
    const runtimeBootstrapToken = await runtimeBootstrapTokenPromise;
    if (!runtimeBootstrapToken) {
        console.error("[Plugin Runtime] Failed to register renderer runtime client");
        return;
    }
    const entries = (await ipcRenderer.invoke(
        "plugins:get-runtime-entries",
        runtimeBootstrapToken,
        "renderer",
    )) as RuntimeEntry[];
    for (const entry of entries) {
        try {
            const source = (await ipcRenderer.invoke(
                "plugins:get-runtime-script",
                runtimeBootstrapToken,
                entry.id,
                "renderer",
            )) as string | null;
            if (!source) continue;
            const bootstrap = getRendererBootstrap(entry.id, entry.name, source, entry.storageToken);
            await webFrame.executeJavaScript(bootstrap);
        } catch (error) {
            console.error(`[Plugin:${entry.id}] renderer entry failed`, error);
        }
    }
}

void (async () => {
    await loadPreloadPlugins();
    await loadRendererPlugins();
})();
