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

    const t = store.i18n;
    return (
        <ModalRoot size={ModalSizes.SMALL}>
            <ModalHeader close={props.close}>{t["keybind-addKeybind"]}</ModalHeader>
            <ModalBody>
                <span style="display: flex">
                    <Header tag={HeaderTags.H5}>{t["keybind-accelerator"]}</Header>
                    <Show when={containsNumpadKey || (!recording() && accelerator() && !containsNonModifier)}>
                        <p class={classes.error}>{t["keybind-invalidCombo"]}</p>
                    </Show>
                </span>
                <div class={classes.grabBox}>
                    <div style={{ flex: "1", "min-width": "0" }}>
                        <TextBox disabled value={accelerator()} onInput={setAccelerator} />
                    </div>
                    {recording() ? (
                        <Button
                            class={classes.recBtn}
                            onClick={stopRecording}
                            size={ButtonSizes.SMALL}
                            color={ButtonColors.RED}
                        >
                            {t["keybind-recording"]}
                        </Button>
                    ) : (
                        <Button class={classes.recBtn} onClick={startRecording} size={ButtonSizes.SMALL}>
                            {t["keybind-record"]}
                        </Button>
                    )}
                </div>
                <Divider mt mb />
                <Header tag={HeaderTags.H5}>{t["keybind-action"]}</Header>
                <Dropdown
                    value={action()}
                    onChange={(v) => setAction(v as KeybindActions)}
                    limitHeight
                    options={[
                        { label: t["keybind-mute"], value: "mute" },
                        { label: t["keybind-deafen"], value: "deafen" },
                        // { label: t["keybind-pushToTalk"], value: "pushToTalk" }, disabled for now since it requires additional logic to work properly
                        { label: t["keybind-leaveCall"], value: "leaveCall" },
                        { label: t["keybind-navigateForward"], value: "navigateForward" },
                        { label: t["keybind-navigateBack"], value: "navigateBack" },
                        { label: t["keybind-runJavascript"], value: "runJavascript" },
                        { label: t["keybind-openQuickCss"], value: "openQuickCss" },
                    ]}
                />
                <SwitchItem note={t["keybind-globalNote"]} value={global()} onChange={setGlobal}>
                    {t["keybind-global"]}
                </SwitchItem>
                <SwitchItem hideBorder value={enabled()} onChange={setEnabled}>
                    {t["keybind-enabled"]}
                </SwitchItem>
                <Show when={action() === "runJavascript"}>
                    <Divider mt mb />
                    <Header tag={HeaderTags.H5}>{t["keybind-jsCode"]}</Header>
                    <TextBox value={javascriptCode()} onInput={setJavascriptCode} />
                </Show>
            </ModalBody>
            <ModalConfirmFooter
                confirmText={t["keybind-add"]}
                onConfirm={save}
                close={props.close}
                disabled={recording() || !accelerator() || !containsNonModifier || containsNumpadKey}
            />
        </ModalRoot>
    );
};
