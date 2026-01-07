import { Show, createSignal, onCleanup } from "solid-js";
import type { KeybindActions } from "../../../@types/keybind.js";
import { Dropdown } from "./Dropdown.jsx";
import classes from "./KeybindMaker.module.css";

const {
    ui: {
        ModalRoot,
        ModalBody,
        ModalConfirmFooter,
        ModalSizes,
        ModalHeader,
        TextBox,
        Button,
        ButtonSizes,
        ButtonColors,
        Header,
        HeaderTags,
        Divider,
        SwitchItem,
        genId,
    },
    plugin: { store },
} = shelter;

export const KeybindMaker = (props: { close: () => void }) => {
    const [recording, setRecording] = createSignal(false);
    const [accelerator, setAccelerator] = createSignal("");
    const [global, setGlobal] = createSignal(true);
    const [action, setAction] = createSignal<KeybindActions>("mute");
    const [javascriptCode, setJavascriptCode] = createSignal("");
    const [enabled, setEnabled] = createSignal(true);

    let logged: string[] = [];
    let containsNonModifier = false;
    let containsNumpadKey = false;
    let timeout: NodeJS.Timeout | null = null;
    function log(event: KeyboardEvent) {
        const key = event.key.replace(" ", "Space");
        if (logged.includes(key) || logged.length > 3) {
            console.log("already in array");
        } else {
            console.log(key);
            logged.unshift(key);
            if (event.location === 0) {
                containsNonModifier = true;
            } else if (event.location === 3) {
                containsNumpadKey = true;
            }
            setAccelerator(logged.join("+"));
        }
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(stopRecording, 3000);
    }
    function stopRecording() {
        if (!recording()) return;
        setRecording(false);
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        document.body.removeEventListener("keyup", log);
        console.log("Recording stop");
    }
    onCleanup(() => recording() && stopRecording());

    function startRecording() {
        if (recording()) return;
        setRecording(true);

        logged = [];
        containsNonModifier = false;
        containsNumpadKey = false;
        setAccelerator("");
        console.log("Recording start");
        document.body.addEventListener("keyup", log);
    }
    function save() {
        const current = store.settings.keybinds;
        const keybind = {
            accelerator: accelerator(),
            action: action(),
            enabled: enabled(),
            global: global(),
            id: genId(),
            ...(action() === "runJavascript" && { js: javascriptCode() }),
        };
        current.push(keybind);
        store.settings.keybinds = current;
        console.log(current);
        console.log(store.settings.keybinds);
        window.legcord.settings.addKeybind(keybind);
    }

    return (
        <ModalRoot size={ModalSizes.SMALL}>
            <ModalHeader close={props.close}>Add a keybind</ModalHeader>
            <ModalBody>
                <span style="display: flex">
                    <Header tag={HeaderTags.H5}>Accelerator</Header>
                    <Show when={containsNumpadKey || (!recording() && accelerator() && !containsNonModifier)}>
                        <p class={classes.error}>This key combination is invalid or not supported.</p>
                    </Show>
                </span>
                <div class={classes.grabBox}>
                    {/* FIXME -  I have no idea what this `disabled` tag is, its not in the typedefs 
                    // @ts-expect-error*/}
                    <TextBox disabled value={accelerator()} onInput={setAccelerator} />
                    {recording() ? (
                        <Button
                            class={classes.recBtn}
                            onClick={stopRecording}
                            size={ButtonSizes.SMALL}
                            color={ButtonColors.RED}
                        >
                            Recording
                        </Button>
                    ) : (
                        <Button class={classes.recBtn} onClick={startRecording} size={ButtonSizes.SMALL}>
                            Record
                        </Button>
                    )}
                </div>
                <Divider mt mb />
                <Header tag={HeaderTags.H5}>Action</Header>
                <Dropdown
                    value={action()}
                    onChange={(v) => setAction(v as KeybindActions)}
                    limitHeight
                    options={[
                        { label: "Mute", value: "mute" },
                        { label: "Deafen", value: "deafen" },
                        { label: "Leave call", value: "leaveCall" },
                        { label: "Navigate forward", value: "navigateForward" },
                        { label: "Navigate back", value: "navigateBack" },
                        { label: "Run Javascript", value: "runJavascript" },
                        { label: "Open Quick CSS", value: "openQuickCss" },
                    ]}
                />
                <SwitchItem
                    note="Allows you to assign a specific keyboard shortcut that can be used across different applications and programs."
                    value={global()}
                    onChange={setGlobal}
                >
                    Global
                </SwitchItem>
                <SwitchItem hideBorder value={enabled()} onChange={setEnabled}>
                    Enabled
                </SwitchItem>
                <Show when={action() === "runJavascript"}>
                    <Divider mt mb />
                    <Header tag={HeaderTags.H5}>Javascript code</Header>
                    <TextBox value={javascriptCode()} onInput={setJavascriptCode} />
                </Show>
            </ModalBody>
            <ModalConfirmFooter
                confirmText="Add"
                onConfirm={save}
                close={props.close}
                disabled={recording() || !accelerator() || !containsNonModifier || containsNumpadKey}
            />
        </ModalRoot>
    );
};
