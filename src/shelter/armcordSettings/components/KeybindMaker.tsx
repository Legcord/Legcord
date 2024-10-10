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
        openConfirmationModal,
        genId,
    },
    plugin: { store },
} = shelter;
export const KeybindMaker = () => {
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
        window.armcord.settings.addKeybind(keybind);
        if (!global()) {
            openConfirmationModal({
                header: () => "Restart required",
                body: () => "Local keybinds require a restart to take effect.",
                type: "danger",
                confirmText: "Restart",
                cancelText: "I'll do it later",
            }).then(
                () => window.armcord.restart(),
                () => console.log("restart skipped"),
            );
        }
    }
    return (
        <ModalRoot size={ModalSizes.SMALL}>
            <ModalHeader
                close={() => {
                    null; //FIXME - IMPLEMENT
                }}
            >
                Add a keybind
            </ModalHeader>
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
                    onChange={(e) => setAction((e.target as HTMLInputElement).value as KeybindActions)}
                >
                    <option value="mute">Mute</option>
                    <option value="deafen">Deafen</option>
                    <option value="navigateForward">Navigate forward</option>
                    <option value="navigateBack">Navigate back</option>
                    <option value="runJavascript">Run Javascript</option>
                    <option value="openQuickCss">Open Quick CSS</option>
                </Dropdown>
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
            {/* FIXME - Implement close()? */}
            <ModalConfirmFooter confirmText="Add" onConfirm={save} close={() => {}} />{" "}
        </ModalRoot>
    );
};
