import { fetchApp, fetchAssetId, fetchExternalAsset } from "./asset.js";

const {
    flux: { dispatcher: FluxDispatcher },
} = shelter;

const LAST_DETECTED_MAX = 5;

async function listen(msg: {
    activity: {
        assets: { large_image: string | null | undefined; small_image: string | null | undefined };
        application_id: number;
        name: string;
    };
}) {
    if (!window.legcordRPC) return;

    // Handle game closing by dispatching update to clear status
    if (!msg.activity) {
        console.log("RPC activity cleared (game closed)");
        FluxDispatcher.dispatch({ type: "LOCAL_ACTIVITY_UPDATE", ...msg });
        return;
    }

    const appId = msg.activity.application_id;
    const app = await fetchApp(appId);
    const gameName = msg.activity.name || app.name;
    if (!msg.activity.name) msg.activity.name = gameName;

    const rpc = window.legcordRPC;
    const entry = { name: gameName, id: appId };
    rpc.lastDetectedGames = [entry, ...(rpc.lastDetectedGames || []).filter((g) => g.id !== appId)].slice(
        0,
        LAST_DETECTED_MAX,
    );
    rpc.onLastDetectedUpdate?.(rpc.lastDetectedGames);

    const blacklist = window.legcord.rpc.getBlacklist();
    if (blacklist.some((g) => g.id === Number(appId))) {
        // @ts-expect-error
        msg.activity = null; // clear activity to prevent blacklisted game from showing up in status
        FluxDispatcher.dispatch({ type: "LOCAL_ACTIVITY_UPDATE", ...msg });
        return console.log(`Game ${gameName} (${appId}) is blacklisted, skipping...`);
    }
    if (
        msg.activity?.assets?.large_image?.startsWith("https://") ??
        msg.activity?.assets?.small_image?.startsWith("https://")
    ) {
        if (typeof msg.activity.assets.large_image === "string") {
            msg.activity.assets.large_image = await fetchExternalAsset(
                msg.activity.application_id,
                msg.activity.assets.large_image,
            );
        }
        if (typeof msg.activity.assets.small_image === "string") {
            msg.activity.assets.small_image = await fetchExternalAsset(
                msg.activity.application_id,
                msg.activity.assets.small_image,
            );
        }
    } else {
        if (msg.activity?.assets?.large_image)
            msg.activity.assets.large_image = await fetchAssetId(
                msg.activity.application_id,
                msg.activity.assets.large_image,
            );
        if (msg.activity?.assets?.small_image)
            msg.activity.assets.small_image = await fetchAssetId(
                msg.activity.application_id,
                msg.activity.assets.small_image,
            );
    }

    console.log("RPC activity update", msg.activity);
    FluxDispatcher.dispatch({ type: "LOCAL_ACTIVITY_UPDATE", ...msg }); // set RPC status
}

export function onLoad() {
    window.legcordRPC = {
        lastDetectedGames: [],
        onLastDetectedUpdate: null,
        listen,
    };
}
