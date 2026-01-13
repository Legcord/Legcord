import type { Game } from "arrpc";
import { createSignal } from "solid-js";
const {
    ui: {
        ModalRoot,
        ModalBody,
        ModalConfirmFooter,
        ModalSizes,
        ModalHeader,
        TextBox,
        Header,
        HeaderTags,
        Divider,
        showToast,
    },
    plugin: { store },
} = shelter;
export const AddDetectableModal = (props: { close: () => void; executable: string }) => {
    const [appName, setAppName] = createSignal("");
    const [appId, setAppId] = createSignal("");
    const [themes, setThemes] = createSignal("");
    const [aliases, setAliases] = createSignal("");
    const [enabled, setEnabled] = createSignal(true);

    function save() {
        if (!appName().trim() || !appId().trim() || !props.executable) {
            return showToast({
                title: "Missing fields",
                content: "Please fill in all fields before adding.",
                duration: 3000,
            });
        }
        const current = store.settings.detectables || [];
        const game: Game = {
            name: appName().trim(),
            executables: [
                {
                    name: props.executable,
                    is_launcher: false,
                    os: window.legcord.platform as "win32" | "linux" | "darwin",
                },
            ],
            id: appId().trim(),
            aliases:
                aliases()
                    .split(",")
                    .map((a) => a.trim()) || [],
            hook: false,
            overlay: true,
            overlay_compatibility_hook: false,
            overlay_methods: null,
            overlay_warn: false,
            themes:
                themes()
                    .split(",")
                    .map((t) => t.trim()) || [],
        };
        current.push(game);
        store.settings.detectables = current;
        window.legcord.rpc.addDetectable(game);
        props.close();
    }

    return (
        <ModalRoot size={ModalSizes.SMALL}>
            <ModalHeader close={props.close}>Add Detectable Application</ModalHeader>
            <ModalBody>
                <Header tag={HeaderTags.H5}>App Name*</Header>
                <TextBox value={appName()} onInput={setAppName} placeholder="e.g. Discord" />
                <Divider mt mb />
                <Header tag={HeaderTags.H5}>App ID*</Header>
                <TextBox value={appId()} onInput={setAppId} placeholder="e.g. 1234567890" />
                <Divider mt mb />
                <Header tag={HeaderTags.H5}>Themes</Header>
                <TextBox value={themes()} onInput={setThemes} placeholder="Action, Adventure" />
                <Divider mt mb />
                <Header tag={HeaderTags.H5}>Aliases</Header>
                <TextBox value={aliases()} onInput={setAliases} placeholder="Alias1, Alias2" />
                <label style={{ display: "flex", "align-items": "center", gap: "0.5em" }}>
                    <input
                        type="checkbox"
                        checked={enabled()}
                        onChange={(e) => setEnabled((e.target as HTMLInputElement).checked)}
                    />
                    Enabled
                </label>
            </ModalBody>
            <ModalConfirmFooter confirmText="Add" onConfirm={save} close={props.close} />
        </ModalRoot>
    );
};
