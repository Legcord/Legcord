import { Show, createSignal } from "solid-js";
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
        Header,
        HeaderTags,
        Divider,
        SwitchItem,
        genId,
        showToast,
    },
    plugin: { store },
} = shelter;
export const KeybindMaker = (props: { close: () => void }) => {
    const [accelerator, setAccelerator] = createSignal("");
    const [global, setGlobal] = createSignal(true);
    const [action, setAction] = createSignal<KeybindActions>("mute");
    const [javascriptCode, setJavascriptCode] = createSignal("");
    const [enabled, setEnabled] = createSignal(true);
    let logged: string[] = [];
    let lock = false;
    function grabKeys() {
        if (lock) return;
        lock = true;
        logged = [];
        setAccelerator("");
        console.log("Recording start");
        document.body.addEventListener("keyup", function log(event) {
            const key = event.key;
            if (logged.includes(key) || logged.length > 3) {
                console.log("already in array");
            } else {
                key.replace(" ", "Space");
                console.log(key);
                logged.push(key);
                setAccelerator(`${key}+${accelerator()}`);
            }
            setTimeout(() => {
                if (lock) {
                    lock = false;
                    document.body.removeEventListener("keyup", log);
                    console.log("Recording stop");
                    setAccelerator(accelerator().slice(0, -1));
                }
            }, 3000);
        });
    }
    function save() {
        if (lock)
            return showToast({
                title: "Slow down!",
                content: "Pause for a few seconds after recording a keybind before saving it.",
                duration: 3000,
            });
        if (accelerator() === "") return;
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
                <Header tag={HeaderTags.H5}>Accelerator</Header>
                <div class={classes.grabBox}>
                    {/* FIXME -  I have no idea what this `disabled` tag is, its not in the typedefs 
                    // @ts-expect-error*/}
                    <TextBox disabled value={accelerator()} onInput={setAccelerator} />
                    <Button onClick={grabKeys} size={ButtonSizes.MEDIUM}>
                        Record
                    </Button>
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
            <ModalConfirmFooter confirmText="Add" onConfirm={save} close={props.close} />
        </ModalRoot>
    );
};
