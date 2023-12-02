window.addEventListener("load", async () => {
  let Dispatcher = undefined,
    lookupAsset = undefined,
    lookupApp = undefined;

  let apps = {};
  const chunkName = 'webpackChunkdiscord_app';

  const wpRequire = window[chunkName].push(
    [ [Symbol()], {}, (x) => x ]
  );

  const cache = wpRequire.c;
  window[chunkName].pop();

  for (const id in cache) {
    let mod = cache[id].exports;
    if (typeof mod !== "object") continue;

    let candidates;
    try {
      candidates = Object.values(mod);
    } catch {
      continue;
    }

    for (const candidate of candidates) {
      if (candidate && candidate.register && candidate.wait) {
        Dispatcher = candidate;
        break;
      }
    }
  }

  const factories = wpRequire.m;
  for (const id in factories) {
    if (
      factories[id]
        .toString()
        .includes("getAssetImage: size must === [number, number] for Twitch")
    ) {
      const mod = wpRequire(id);

      // fetchAssetIds
      const _lookupAsset = Object.values(mod).find(
        (e) =>
          typeof e === "function" &&
          e.toString().includes("APPLICATION_ASSETS_FETCH_SUCCESS"),
      );
      if (_lookupAsset)
        lookupAsset = async (appId, name) =>
          (await _lookupAsset(appId, [name, undefined]))[0];
    }
    if (lookupAsset) break;
  }

  for (const id in factories) {
    if (factories[id].toString().includes("APPLICATION_RPC")) {
      const mod = wpRequire(id);

      // fetchApplicationsRPC
      const _lookupApp = Object.values(mod).find(
        (e) => typeof e === "function" && e.toString().includes(",coverImage:"),
      );
      if (_lookupApp)
        lookupApp = async (appId) => {
          let socket = {};
          await _lookupApp(socket, appId);
          return socket.application;
        };
    }
    if (lookupApp) break;
  }

  ArmCordRPC.listen(async (msg) => {
    if (msg.activity) {
      if (msg.activity?.assets?.large_image && lookupAsset)
        msg.activity.assets.large_image = await lookupAsset(
          msg.activity.application_id,
          msg.activity.assets.large_image,
        );
      if (msg.activity?.assets?.small_image && lookupAsset)
        msg.activity.assets.small_image = await lookupAsset(
          msg.activity.application_id,
          msg.activity.assets.small_image,
        );

      const appId = msg.activity.application_id;
      if (!apps[appId] && lookupApp) apps[appId] = await lookupApp(appId);

      const app = apps[appId];
      if (!msg.activity.name) msg.activity.name = app.name;
    }

    Dispatcher.dispatch({ type: "LOCAL_ACTIVITY_UPDATE", ...msg }); // set RPC status
  });
});
