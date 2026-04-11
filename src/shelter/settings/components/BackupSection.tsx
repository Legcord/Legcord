import { createSignal } from "solid-js";
import classes from "./BackupSection.module.css";

const {
    ui: {
        Button,
        Header,
        HeaderTags,
        ButtonSizes,
        Divider,
        openModal,
        openConfirmationModal,
        ModalRoot,
        ModalBody,
        ModalConfirmFooter,
        ModalSizes,
        ModalHeader,
        SwitchItem,
        showToast,
    },
    plugin: { store },
} = shelter;

type IncludeOptions = {
    legcordConfig: boolean;
    legcordThemesAndQuickCss: boolean;
    legcordExtensionPlugins: boolean;
    vencordModData: boolean;
    equicordModData: boolean;
    shelterModData: boolean;
    modBundles: boolean;
};

const defaultIncludes: IncludeOptions = {
    legcordConfig: true,
    legcordThemesAndQuickCss: true,
    legcordExtensionPlugins: true,
    vencordModData: true,
    equicordModData: true,
    shelterModData: true,
    modBundles: true,
};
function getLocalStoragePropertyDescriptor() {
    const iframe = document.createElement("iframe");
    document.head.append(iframe);
    const pd = Object.getOwnPropertyDescriptor(iframe.contentWindow, "localStorage");
    iframe.remove();
    return pd;
}

const pd = getLocalStoragePropertyDescriptor();
const localStorage = pd?.get?.call(window) ?? window.localStorage;

function BackupOptionsModal(props: {
    close: () => void;
    onConfirm: (includes: IncludeOptions) => void;
}) {
    const t = store.i18n;
    const [includes, setIncludes] = createSignal<IncludeOptions>({ ...defaultIncludes });

    function patch<K extends keyof IncludeOptions>(key: K, value: boolean) {
        setIncludes((prev) => ({ ...prev, [key]: value }));
    }

    function confirm() {
        props.onConfirm(includes());
        props.close();
    }

    const inc = includes;

    return (
        <ModalRoot size={ModalSizes.MEDIUM}>
            <ModalHeader close={props.close}>{t["backup-modalTitle"]}</ModalHeader>
            <ModalBody>
                <Header tag={HeaderTags.H5} class={classes.modalEyebrow}>
                    {t["splash-title"]}
                </Header>
                <SwitchItem hideBorder value={inc().legcordConfig} onChange={(v: boolean) => patch("legcordConfig", v)}>
                    {t["backup-includeLegcordConfig"]}
                </SwitchItem>
                <SwitchItem
                    hideBorder
                    value={inc().legcordThemesAndQuickCss}
                    onChange={(v: boolean) => patch("legcordThemesAndQuickCss", v)}
                >
                    {t["backup-includeLegcordThemes"]}
                </SwitchItem>
                <SwitchItem
                    hideBorder
                    value={inc().legcordExtensionPlugins}
                    onChange={(v: boolean) => patch("legcordExtensionPlugins", v)}
                >
                    {t["backup-includeLegcordPlugins"]}
                </SwitchItem>
                <Divider mt mb />
                <SwitchItem
                    hideBorder
                    value={inc().vencordModData}
                    onChange={(v: boolean) => patch("vencordModData", v)}
                >
                    {t["backup-includeVencord"]}
                </SwitchItem>
                <SwitchItem
                    hideBorder
                    value={inc().equicordModData}
                    onChange={(v: boolean) => patch("equicordModData", v)}
                >
                    {t["backup-includeEquicord"]}
                </SwitchItem>
                <SwitchItem
                    hideBorder
                    value={inc().shelterModData}
                    onChange={(v: boolean) => patch("shelterModData", v)}
                >
                    {t["backup-includeShelter"]}
                </SwitchItem>
                <SwitchItem hideBorder value={inc().modBundles} onChange={(v: boolean) => patch("modBundles", v)}>
                    {t["backup-includeModBundles"]}
                </SwitchItem>
            </ModalBody>
            <ModalConfirmFooter confirmText={t["backup-confirmBackup"]} onConfirm={confirm} close={props.close} />
        </ModalRoot>
    );
}

function applyClientModsFromRestore(raw: unknown): void {
    if (!raw || typeof raw !== "object") return;
    const cm = raw as Record<string, unknown>;
    if (typeof cm.vencordLocalStorage === "string" && cm.vencordLocalStorage.length > 0) {
        localStorage.setItem("VencordSettings", cm.vencordLocalStorage);
    }
    if (typeof cm.equicordLocalStorage === "string" && cm.equicordLocalStorage.length > 0) {
        localStorage.setItem("EquicordSettings", cm.equicordLocalStorage);
    }
    if (cm.shelter && typeof cm.shelter === "object") {
        const shelterData = cm.shelter as { plugins?: unknown; enabledPlugins?: unknown };
        console.log("Restoring shelter plugins", shelterData);
        if (shelterData.plugins && typeof shelterData.plugins === "object") {
            for (const [id, data] of Object.entries(
                shelterData.plugins as Record<string, { src: string; update: boolean }>,
            )) {
                shelter.plugins.addRemotePlugin(id, data.src, data.update);
            }
        }
    }
}

export function BackupSection() {
    const t = store.i18n;

    function buildClientMods(includes: IncludeOptions) {
        const vencordSettings = localStorage.getItem("VencordSettings");
        const equicordSettings = localStorage.getItem("EquicordSettings");
        const shelterPlugins = shelter.plugins.installedPlugins();
        const shelterEnabledPlugins = shelter.plugins.loadedPlugins();

        return {
            vencordLocalStorage: includes.vencordModData ? vencordSettings : undefined,
            equicordLocalStorage: includes.equicordModData ? equicordSettings : undefined,
            shelter: includes.shelterModData
                ? { plugins: shelterPlugins, enabledPlugins: shelterEnabledPlugins }
                : undefined,
        };
    }

    async function runBackup(includes: IncludeOptions) {
        const payload = {
            includes,
            clientMods: buildClientMods(includes),
        };
        const result = await window.legcord.backup.save(JSON.stringify(payload));
        if (result.ok) {
            showToast({
                title: t["backup-successTitle"],
                content: t["backup-successBody"],
                duration: 4000,
            });
        } else if (result.error === "CANCELLED") {
            showToast({
                title: t["backup-cancelledTitle"],
                content: t["backup-cancelledBody"],
                duration: 3000,
            });
        } else {
            showToast({
                title: t["backup-failedTitle"],
                content: result.error,
                duration: 5000,
            });
        }
    }

    function openBackupModal() {
        openModal(({ close }: { close: () => void }) => (
            <BackupOptionsModal
                close={close}
                onConfirm={(includes) => {
                    void runBackup(includes);
                }}
            />
        ));
    }

    function restoreFromBackup() {
        openConfirmationModal({
            header: () => t["backup-restoreConfirmHeader"],
            body: () => t["backup-restoreConfirmBody"],
            type: "danger",
            confirmText: t["backup-restoreConfirm"],
            cancelText: t["backup-restoreCancel"],
        }).then(
            async () => {
                const raw = await window.legcord.backup.restore();
                let parsed: { ok?: boolean; error?: string; clientMods?: unknown };
                try {
                    parsed = JSON.parse(raw) as typeof parsed;
                } catch {
                    showToast({
                        title: t["backup-failedTitle"],
                        content: t["backup-invalidFile"],
                        duration: 5000,
                    });
                    return;
                }
                if (parsed.ok === false) {
                    if (parsed.error === "CANCELLED") {
                        showToast({
                            title: t["backup-cancelledTitle"],
                            content: t["backup-cancelledBody"],
                            duration: 3000,
                        });
                        return;
                    }
                    showToast({
                        title: t["backup-failedTitle"],
                        content: parsed.error ?? t["backup-unknownError"],
                        duration: 5000,
                    });
                    return;
                }
                applyClientModsFromRestore(parsed.clientMods);
                showToast({
                    title: t["backup-restoreDoneTitle"],
                    content: t["backup-restoreDoneBody"],
                    duration: 6000,
                });
            },
            () => {},
        );
    }

    return (
        <div class={classes.item}>
            <Header class={classes.title} tag={HeaderTags.H3}>
                {t["backup-pageTitle"]}
            </Header>
            <div class={classes.note}>{t["backup-pageSubtitle"]}</div>
            <div class={classes.actions}>
                <Button onClick={openBackupModal} size={ButtonSizes.LARGE}>
                    {t["backup-createBackup"]}
                </Button>
                <Button onClick={restoreFromBackup} size={ButtonSizes.LARGE} type="danger">
                    {t["backup-restore"]}
                </Button>
            </div>
            <Divider />
        </div>
    );
}
