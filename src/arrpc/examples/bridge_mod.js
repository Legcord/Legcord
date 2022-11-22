(() => {
    let Dispatcher,
        lookupAsset,
        lookupApp,
        apps = {};

    const ws = new WebSocket("ws://127.0.0.1:1337"); // connect to arRPC bridge websocket
    ws.onmessage = async (x) => {
        msg = JSON.parse(x.data);
        console.log(msg);

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

        if (msg.activity?.assets?.large_image)
            msg.activity.assets.large_image = await lookupAsset(
                msg.activity.application_id,
                msg.activity.assets.large_image
            );
        if (msg.activity?.assets?.small_image)
            msg.activity.assets.small_image = await lookupAsset(
                msg.activity.application_id,
                msg.activity.assets.small_image
            );

        const appId = msg.activity.application_id;
        if (!apps[appId]) apps[appId] = await lookupApp(appId);

        const app = apps[appId];
        if (!msg.activity.name) msg.activity.name = app.name;

        Dispatcher.dispatch({type: "LOCAL_ACTIVITY_UPDATE", ...msg}); // set RPC status
    };
})();
