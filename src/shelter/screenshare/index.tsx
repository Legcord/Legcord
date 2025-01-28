import type { Node } from "@vencord/venmic";
import { ScreensharePicker } from "./components/ScreensharePicker.jsx";
import type { IPCSources } from "./components/SourceCard.jsx";

const {
    util: { log },
    flux: {
        stores: { UserStore, MediaEngineStore },
        dispatcher,
    },
    ui: { openModal },
    plugin: { store },
} = shelter;

store.fps ??= 30; // set default
store.resolution ??= 720; // set default

function onStreamQualityChange() {
    // @ts-expect-error fix types
    const mediaConnections = [...MediaEngineStore.getMediaEngine().connections];
    // @ts-expect-error fix types
    const currentUserId = UserStore.getCurrentUser().id;
    const keptAspectWidth = Math.round(store.resolution * (16 / 9));
    const calculatedTargetBitrate = Math.round(
        keptAspectWidth * store.resolution * store.fps * 0.08, // width * height * fps * bits per pixel value (apprx.)
    );
    const streamConnection = mediaConnections.find((connection) => connection.streamUserId === currentUserId);
    if (streamConnection) {
        streamConnection.videoStreamParameters[0].maxFrameRate = store.fps;
        streamConnection.videoStreamParameters[0].maxResolution.height = store.resolution;
        streamConnection.videoStreamParameters[0].maxResolution.width = keptAspectWidth;
        streamConnection.videoQualityManager.goliveMaxQuality.bitrateMin =
            calculatedTargetBitrate - calculatedTargetBitrate * 0.05; // remove 5% of target bitrate for ground bitrate
        streamConnection.videoQualityManager.goliveMaxQuality.bitrateMax =
            calculatedTargetBitrate + calculatedTargetBitrate * 0.25; // add 25% of target bitrate for ceiling bitrate
        streamConnection.videoQualityManager.goliveMaxQuality.bitrateTarget = calculatedTargetBitrate;
        log(
            `Patched current user stream with resolution: ${store.resolution} and fps: ${store.fps} at ${calculatedTargetBitrate / 1000}kbps target bitrate`,
        );
    }
}

interface StreamDispatch {
    streamKey?: string;
    reason?: string;
}
function onStreamEnd(dispatch: StreamDispatch) {
    if (!dispatch.streamKey) return;
    const owner = dispatch.streamKey.split(":").at(-1);
    // @ts-expect-error fix types
    const currentUserId = UserStore.getCurrentUser().id;
    if (dispatch.reason === "user_requested" && owner === currentUserId) {
        window.legcord.screenshare.venmicStop();
    }
}

export function onLoad() {
    log("Legcord Screenshare Module");
    // @ts-expect-error fix types
    window.legcord.screenshare.getSources(async (_event: Event, sources: IPCSources[]) => {
        let audioSources: Node[] | undefined;
        if (window.legcord.platform === "linux") {
            const venmic = await window.legcord.screenshare.venmicList();
            if (venmic.ok) {
                audioSources = venmic.targets;
                console.log(`Venmic audio source targets: ${audioSources.map((node) => node["node.name"])}`);
            } else {
                console.log("Venmic is NOT OK. Venmic will not be available for screensharing with audio.");
            }
        }
        openModal(({ close }: { close: () => void }) => (
            <ScreensharePicker sources={sources} close={close} audioSources={audioSources} />
        ));
    });
    dispatcher.subscribe("MEDIA_ENGINE_VIDEO_SOURCE_QUALITY_CHANGED", onStreamQualityChange);
    dispatcher.subscribe("STREAM_DELETE", onStreamEnd);
}

export function onUnload() {
    dispatcher.unsubscribe("MEDIA_ENGINE_VIDEO_SOURCE_QUALITY_CHANGED", onStreamQualityChange);
    dispatcher.unsubscribe("STREAM_DELETE", onStreamEnd);
}
