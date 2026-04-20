import type { Node } from "@vencord/venmic";
import { For, Show, createSignal, onCleanup } from "solid-js";
import { Dropdown } from "../../settings/components/Dropdown.jsx";
import { SegmentedControl } from "../../settings/components/SegmentedControl.jsx";
import classes from "./ScreensharePicker.module.css";
import { type IPCSources, SourceCard } from "./SourceCard.jsx";

const {
    ui: {
        ModalRoot,
        ModalBody,
        ModalConfirmFooter,
        ModalSizes,
        ModalHeader,
        Header,
        HeaderTags,
        Divider,
        Checkbox,
        showToast,
    },
    plugin: { store },
} = shelter;

async function getVirtmic() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevice = devices.find(({ label }) => label === "vencord-screen-share");
        return audioDevice?.deviceId;
    } catch (error) {
        return null;
    }
}

const original = navigator.mediaDevices.getDisplayMedia;
export async function patchNavigator() {
    navigator.mediaDevices.getDisplayMedia = async function (opts) {
        const stream = await original.call(this, opts);
        const video = stream.getVideoTracks()[0];

        const width = store.resolution * (16 / 9);
        const height = store.resolution;

        const stream_constraints: MediaTrackConstraints = {
            frameRate: store.fps,
            width: width,
            height: height,
        };

        video
            .applyConstraints(stream_constraints)
            .then(() => console.info("Applied video stream track settings.", stream_constraints))
            .catch(() => {
                console.error("Failed to apply video stream track settings.", stream_constraints);
            });

        const virtmic_id = await getVirtmic();
        stream.getAudioTracks().forEach((t) => stream.removeTrack(t));
        if (virtmic_id) {
            const audio = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: {
                        exact: virtmic_id,
                    },
                    autoGainControl: false,
                    echoCancellation: false,
                    noiseSuppression: false,
                    channelCount: 2,
                },
            });
            audio.getAudioTracks().forEach((t) => stream.addTrack(t));
        }

        return stream;
    };
}

export const ScreensharePicker = (props: {
    close: () => void;
    sources: IPCSources[];
    audioSources: Node[] | undefined;
}) => {
    const [source, setSource] = createSignal("none");
    const [audioSource, setAudioSource] = createSignal<Node | undefined>(undefined);
    const [name, setName] = createSignal("nothing...");
    const [audio, setAudio] = createSignal(false);
    if (props.sources.length === 1) {
        setSource(props.sources[0].id);
        setName(props.sources[0].name);
    }

    const t = store.i18n;
    function startScreenshare() {
        if (source() === "") {
            showToast(t["screenshare-selectSource"], "error");
        }

        patchNavigator();

        window.legcord.screenshare.start(source(), name(), audio());

        props.close();
    }

    function closeAndSave() {
        window.legcord.screenshare.start("none", "", false);
        props.close();
    }

    async function updateVenmicSource(source: Node) {
        return await window.legcord.screenshare.venmicStart([source]);
    }

    onCleanup(closeAndSave);

    return (
        <ModalRoot size={ModalSizes.MEDIUM} style="max-height: 90vh;">
            <ModalHeader close={closeAndSave}>{t["screenshare-title"]}</ModalHeader>
            <ModalBody>
                <div class={classes.sources}>
                    <For each={props.sources}>
                        {(source: IPCSources) => (
                            <SourceCard
                                selected_name={name}
                                source={source}
                                onSelect={(srcId, name) => {
                                    setSource(srcId);
                                    setName(name);
                                }}
                            />
                        )}
                    </For>
                </div>
                <div class={classes.settingsSection}>
                    <div class={classes.selectedBanner}>
                        <svg class={classes.selectedIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <title>Monitor</title>
                            <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2" />
                            <path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                        </svg>
                        <span class={classes.selectedLabel}>Sharing:</span>
                        <span class={classes.selectedName}>{name()}</span>
                    </div>
                    <div class={classes.qualityBox}>
                        <div class={classes.controlGroup}>
                            <Header class={classes.header} tag={HeaderTags.H4}>
                                Resolution
                            </Header>
                            <SegmentedControl
                                value={store.resolution}
                                onChange={(v) => {
                                    store.resolution = Number(v);
                                }}
                                options={[
                                    { label: "480p", value: "480" },
                                    { label: "720p", value: "720" },
                                    { label: "1080p", value: "1080" },
                                    { label: "1440p", value: "1440" },
                                    { label: "2160p", value: "2160" },
                                ]}
                            />
                        </div>
                        <div class={classes.controlGroup}>
                            <Header class={classes.header} tag={HeaderTags.H4}>
                                FPS
                            </Header>
                            <SegmentedControl
                                value={store.fps}
                                onChange={(v) => {
                                    store.fps = Number(v);
                                }}
                                options={[
                                    { label: "5", value: "5" },
                                    { label: "15", value: "15" },
                                    { label: "30", value: "30" },
                                    { label: "60", value: "60" },
                                ]}
                            />
                        </div>
                    </div>
                    <Show when={window.legcord.platform !== "darwin"}>
                        <div class={classes.audioRow} style="margin-top: 12px;">
                            <div class={classes.audioLabel}>
                                <svg class={classes.audioIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <title>Audio</title>
                                    <path
                                        d="M11 5L6 9H2v6h4l5 4V5z"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                    <path
                                        d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                                Share Audio
                            </div>
                            <Checkbox checked={audio()} onChange={setAudio} />
                        </div>
                    </Show>

                    <Show when={window.legcord.platform === "linux" && props.audioSources !== undefined && audio()}>
                        <Divider mt mb />
                        <Header tag={HeaderTags.H4}>Venmic</Header>
                        <Dropdown
                            value={audioSource()?.["node.name"] ?? "Venmic disabled"}
                            onChange={(v) => {
                                const source = props.audioSources!.find((node) => node["node.name"] === v);
                                if (!source) return;
                                setAudioSource(source);
                                updateVenmicSource(source);
                            }}
                            limitHeight
                            options={[
                                {
                                    label: t["screenshare-venmicDisabled"],
                                    value: "Venmic disabled",
                                },
                                ...(props.audioSources?.map((s) => ({
                                    label: s["node.name"],
                                    value: s["node.name"],
                                })) ?? []),
                            ]}
                        />
                    </Show>
                </div>
            </ModalBody>
            <ModalConfirmFooter
                confirmText={t["screenshare-share"]}
                onConfirm={startScreenshare}
                close={closeAndSave}
            />
        </ModalRoot>
    );
};
