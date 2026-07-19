import { InviteModal } from "./InviteModal.jsx";

const {
    ui: { openModal },
    util: { log },
} = shelter;

export function onLoad() {
    log("Legcord Invite Handler");

    window.legcordInvite = {
        show: (code: string) => {
            openModal(({ close }: { close: () => void }) => (
                <InviteModal close={close} code={code} />
            ));
        },
    };
}

export function onUnload() {
    window.legcordInvite = undefined;
}
