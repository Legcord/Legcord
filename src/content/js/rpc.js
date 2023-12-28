{
    const cb = () => {
        let Dispatcher,
            lookupAsset,
            lookupApp,
            apps = {};

        ArmCordRPC.listen(async (msg) => {
            console.warn(msg);
            if (!Dispatcher) {
                let wpRequire;
                window.webpackChunkdiscord_app.push([[Symbol()], {}, (x) => (wpRequire = x)]);
                window.webpackChunkdiscord_app.pop();

                const modules = wpRequire.c;
                lookupAsset = Object.values(modules).find((m) => m.exports?.fetchAssetIds).exports.fetchAssetIds;
                lookupApp = Object.values(modules).find((m) => m.exports?.fetchApplicationsRPC).exports
                    .fetchApplicationsRPC;

                for (const id in modules) {
                    const mod = modules[id].exports;
                    if (!mod?.__esModule) continue;

                    for (const prop in mod) {
                        if (!mod.hasOwnProperty(prop)) continue;

                        const candidate = mod[prop];
                        if (candidate && candidate.register && candidate.wait) {
                            Dispatcher = candidate;
                            break;
                        }
                    }

                    if (Dispatcher) break;
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

            if (msg.activity) {
                const appId = msg.activity.application_id;
                if (!apps[appId]) apps[appId] = await lookupApp(appId);

                const app = apps[appId];
                if (!msg.activity.name) msg.activity.name = app.name;
            }
            Dispatcher.dispatch({type: "LOCAL_ACTIVITY_UPDATE", ...msg}); // set RPC status
        });
    };

    cb();
    setInterval(cb, 30 * 1000);
}
