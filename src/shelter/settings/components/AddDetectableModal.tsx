import type { Game } from "arrpc";
import { createSignal } from "solid-js";
import { setRestartRequired } from "../settings.js";
import classes from "./AddDetectableModal.module.css";

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
        SwitchItem,
        showToast,
        openConfirmationModal,
        Text,
        TextTags,
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
                title: store.i18n["detectable-missingFields"],
                content: store.i18n["detectable-fillAllFields"],
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
            aliases: aliases()
                .split(",")
                .map((a) => a.trim())
                .filter(Boolean),
            hook: false,
            overlay: true,
            overlay_compatibility_hook: false,
            overlay_methods: null,
            overlay_warn: false,
            themes: themes()
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
        };
        current.push(game);
        store.settings.detectables = current;
        // Send a plain object so IPC structured clone does not fail (store may wrap with proxies)
        window.legcord.rpc.addDetectable(JSON.parse(JSON.stringify(game)) as Game);
        setRestartRequired();

        props.close();

        openConfirmationModal({
            header: () => store.i18n["settings-restartRequired"],
            body: () => store.i18n["settings-restartRequiredBody"],
            type: "danger",
            confirmText: store.i18n["settings-restart"],
            cancelText: store.i18n["settings-restartLater"],
        }).then(
            () => window.legcord.restart(),
            () => {},
        );
    }

    const t = store.i18n;
    const canSave = () =>
        Boolean(appName().trim() && appId().trim() && props.executable && props.executable !== "refresh");

    return (
        <ModalRoot size={ModalSizes.SMALL}>
            <ModalHeader close={props.close}>{t["detectable-addApp"]}</ModalHeader>
            <ModalBody>
                <Header tag={HeaderTags.HeadingSM}>{t["detectable-appName"]}</Header>
                <TextBox value={appName()} onInput={setAppName} placeholder={t["detectable-placeholderName"]} />
                <Divider mt mb />
                <Header tag={HeaderTags.HeadingSM}>{t["detectable-appId"]}</Header>
                <Text tag={TextTags.textSM} class={classes.fieldNote}>
                    {t["detectable-appId-note"]}
                </Text>
                <TextBox value={appId()} onInput={setAppId} placeholder={t["detectable-placeholderId"]} />
                <Divider mt mb />
                <Header tag={HeaderTags.HeadingSM}>{t["detectable-themes"]}</Header>
                <Text tag={TextTags.textSM} class={classes.fieldNote}>
                    {t["detectable-themes-note"]}
                </Text>
                <TextBox value={themes()} onInput={setThemes} placeholder={t["detectable-placeholderThemes"]} />
                <Divider mt mb />
                <Header tag={HeaderTags.HeadingSM}>{t["detectable-aliases"]}</Header>
                <Text tag={TextTags.textSM} class={classes.fieldNote}>
                    {t["detectable-aliases-note"]}
                </Text>
                <TextBox value={aliases()} onInput={setAliases} placeholder={t["detectable-placeholderAliases"]} />
                <Divider mt mb />
                <SwitchItem hideBorder value={enabled()} onChange={setEnabled}>
                    {t["detectable-enabled"]}
                </SwitchItem>
            </ModalBody>
            <ModalConfirmFooter
                confirmText={t["keybind-add"]}
                onConfirm={save}
                close={props.close}
                disabled={!canSave()}
            />
        </ModalRoot>
    );
};
