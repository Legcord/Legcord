import { For, Show, createSignal } from "solid-js";
import { Dropdown } from "../../settings/components/Dropdown.jsx";
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

export const ScreensharePicker = (props: {
    close: () => void;
    sources: IPCSources[];
}) => {
    const [source, setSource] = createSignal("none");
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
        window.legcord.screenshare.start(source(), name(), audio());
        props.close();
    }
    function closeAndSave() {
        window.legcord.screenshare.start("none", "", false);
        props.close();
    }
    return (
        <ModalRoot size={ModalSizes.SMALL}>
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
                            <Header tag={HeaderTags.H4}>Resolution</Header>
                            <Dropdown
                                value={store.resolution}
                                onChange={(e) => {
                                    store.resolution = Number(e.currentTarget.value);
                                }}
                            >
                                <option value="480">480p</option>
                                <option value="720">720p</option>
                                <option value="1080">1080p</option>
                                <option value="1440">1440p</option>
                            </Dropdown>
                        </div>
                        <div>
                            <Header tag={HeaderTags.H4}>FPS</Header>
                            <Dropdown
                                value={store.fps}
                                onChange={(e) => {
                                    store.fps = Number(e.currentTarget.value);
                                }}
                            >
                                <option value="5">5</option>
                                <option value="15">15</option>
                                <option value="30">30</option>
                                <option value="60">60</option>
                            </Dropdown>
                        </div>
                        <div>
                            <Show when={window.legcord.platform !== "darwin"}>
                                <Header tag={HeaderTags.H4}>Audio</Header>
                                <div class={classes.checkbox}>
                                    <Checkbox checked={audio()} onChange={setAudio} />
                                </div>
                            </Show>
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalConfirmFooter confirmText="Share" onConfirm={startScreenshare} close={closeAndSave} />
        </ModalRoot>
    );
};
