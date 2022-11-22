import {ipcRenderer} from "electron";

let Dispatcher,
    lookupAsset,
    lookupApp,
    apps = {};
ipcRenderer.on("rpc", async (event, data) => {
    if (!Dispatcher) {
        const wpRequire = window.webpackChunkdiscord_app.push([[Symbol()], {}, (x) => x]);
        const cache = wpRequire.c;
        window.webpackChunkdiscord_app.pop();

        for (const id in cache) {
            let mod = cache[id].exports;
            mod = mod && (mod.Z ?? mod.ZP);

            if (mod && mod.register && mod.wait) {
                Dispatcher = mod;
                break;
            }
        }

        const factories = wpRequire.m;
        for (const id in factories) {
            if (factories[id].toString().includes("getAssetImage: size must === [number, number] for Twitch")) {
                const mod = wpRequire(id);

                const _lookupAsset = Object.values(mod).find(
                    (e) => typeof e === "function" && e.toString().includes("apply(")
                );
                lookupAsset = async (appId, name) => (await _lookupAsset(appId, [name, undefined]))[0];

                break;
            }
        }

        for (const id in factories) {
            if (factories[id].toString().includes(`e.application={`)) {
                const mod = wpRequire(id);

                const _lookupApp = Object.values(mod).find(
                    (e) => typeof e === "function" && e.toString().includes(`e.application={`)
                );
                lookupApp = async (appId) => {
                    let socket = {};
                    await _lookupApp(socket, appId);
                    return socket.application;
                };

                break;
            }
        }
    }

    if (data.activity?.assets?.large_image)
        data.activity.assets.large_image = await lookupAsset(
            data.activity.application_id,
            data.activity.assets.large_image
        );
    if (data.activity?.assets?.small_image)
        data.activity.assets.small_image = await lookupAsset(
            data.activity.application_id,
            data.activity.assets.small_image
        );

    const appId = data.activity.application_id;
    if (!apps[appId]) apps[appId] = await lookupApp(appId);

    const app = apps[appId];
    if (!data.activity.name) data.activity.name = app.name;

    Dispatcher.dispatch({type: "LOCAL_ACTIVITY_UPDATE", ...data}); // set RPC status
});
