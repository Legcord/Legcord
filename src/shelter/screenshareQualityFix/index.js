const {
    util: { log },
    flux: {
        stores: { UserStore, MediaEngineStore },
        dispatcher,
    },
    plugin: { store },
} = shelter;
store.fps ??= 30; // set default
store.resolution ??= 720; // set default
function onStreamQualityChange() {
    const mediaConnections = [...MediaEngineStore.getMediaEngine().connections];
    const currentUserId = UserStore.getCurrentUser().id;
    const streamConnection = mediaConnections.find((connection) => connection.streamUserId === currentUserId);
    if (streamConnection) {
        streamConnection.videoStreamParameters[0].maxFrameRate = store.fps;
        streamConnection.videoStreamParameters[0].maxResolution.height = store.resolution;
        streamConnection.videoStreamParameters[0].maxResolution.width = Math.round(store.resolution * (16 / 9));
        streamConnection.videoQualityManager.goliveMaxQuality.bitrateMin = 500000;
        streamConnection.videoQualityManager.goliveMaxQuality.bitrateMax = 8000000;
        streamConnection.videoQualityManager.goliveMaxQuality.bitrateTarget = 600000;
        log(`Patched current user stream with resolution: ${store.resolution} and fps: ${store.fps}`);
    }
}
export function onLoad() {
    dispatcher.subscribe("MEDIA_ENGINE_VIDEO_SOURCE_QUALITY_CHANGED", onStreamQualityChange);
}

export function onUnload() {
    dispatcher.unsubscribe("MEDIA_ENGINE_VIDEO_SOURCE_QUALITY_CHANGED", onStreamQualityChange);
}
export { default as settings } from "./settings";
