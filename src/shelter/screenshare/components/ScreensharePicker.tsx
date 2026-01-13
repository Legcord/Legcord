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

export async function getVirtmic() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevice = devices.find(({ label }) => label === "vencord-screen-share");
        return audioDevice?.deviceId;
    } catch (error) {
        return null;
    }
}
function patchNavigator() {
    const original = navigator.mediaDevices.getDisplayMedia;
    navigator.mediaDevices.getDisplayMedia = async function (opts) {
        const stream = await original.call(this, opts);
        const id = await getVirtmic();
        if (id) {
            const audio = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: {
                        exact: id,
                    },
                    autoGainControl: false,
                    echoCancellation: false,
                    noiseSuppression: false,
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
    function startScreenshare() {
        if (source() === "") {
            showToast("Please select a source", "error");
        }
        console.log(source(), name(), audio());
        if (audioSource() !== undefined && audio()) {
            if (audioSource()!["node.name"] !== "Venmic disabled") {
                console.info("audio venmic module source:", audioSource());
                window.legcord.screenshare.venmicStart([audioSource()!]).then((done) => {
                    if (done) {
                        patchNavigator();
                    }
                });
            }
        }
        window.legcord.screenshare.start(source(), name(), audio());
        props.close();
    }
    function closeAndSave() {
        window.legcord.screenshare.start("none", "", false);
        props.close();
    }
    onCleanup(closeAndSave);

    return (
        <ModalRoot size={ModalSizes.MEDIUM} style="max-height: 90vh;">
            <ModalHeader close={closeAndSave}>Screenshare</ModalHeader>
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
                <div>
                    <br />
                    <Header tag={HeaderTags.EYEBROW}>Picked {name()}</Header>
                    <Divider mt mb />
                    <div class={classes.qualityBox}>
                        <div>
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
                        <div>
                            <Show when={window.legcord.platform !== "darwin"}>
                                <Header class={classes.header} tag={HeaderTags.H4}>
                                    Audio
                                </Header>
                                <div class={classes.checkbox}>
                                    <Checkbox checked={audio()} onChange={setAudio} />
                                </div>
                            </Show>
                        </div>
                        <div>
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

                    <Show when={window.legcord.platform === "linux" && props.audioSources !== undefined && audio()}>
                        <Divider mt mb />
                        <Header tag={HeaderTags.H4}>Venmic</Header>
                        <Dropdown
                            value="Venmic disabled"
                            onChange={(v) => {
                                const source = props.audioSources!.find((node) => node["node.name"] === v);
                                if (!source) return;
                                setAudioSource(source);
                            }}
                            limitHeight
                            options={[
                                { label: "Venmic disabled", value: "Venmic disabled" },
                                ...(props.audioSources?.map((s) => ({
                                    label: s["node.name"],
                                    value: s["node.name"],
                                })) ?? []),
                            ]}
                        />
                    </Show>
                </div>
            </ModalBody>
            <ModalConfirmFooter confirmText="Share" onConfirm={startScreenshare} close={closeAndSave} />
        </ModalRoot>
    );
};
