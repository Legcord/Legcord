import { interface as dbusInterface, sessionBus } from "@jellybrick/dbus-next";
// import { currentHandler } from "./common/commandDefinitions";
import { handleAction, isValidAction } from "./common/handleCommands";

const { Interface } = dbusInterface;

export const DBUS_INTERFACE_NAME = "app.legcord.Legcord";
export const DBUS_ADDRESS = "/app/legcord/Legcord";

// original way of doing it (requires extensive babel plugins and typescript decorators)
// class LegcordInterface extends Interface {
//     @method({ inSignature: "s", outSignature: "", noReply: true, disabled: false })
//     TriggerAction(action: string): void {
//         currentHandler(action);
//     }
// }

// THIS is nescessary only so we don't have to use babel
// plugins all over rolldown.config.ts in every file, and slow down build time.
class LegcordInterface extends Interface {
    constructor() {
        super(DBUS_INTERFACE_NAME);
        this.$methods = {
            TriggerAction: {
                name: "TriggerAction",
                disabled: false,
                noReply: true,
                inSignature: "s",
                outSignature: "",
                inSignatureTree: [{ type: "s", child: [] }],
                outSignatureTree: [],
                fn: (action: string) => {
                    if (!isValidAction(action)) {
                        console.warn("Received unsupported action over DBus:", action);
                        return;
                    }
                    handleAction(action);
                },
            },
        };
    }
}

const bus = sessionBus();
var legcordInterface = new LegcordInterface();

export async function startDbusService(): Promise<void> {
    await bus.requestName(DBUS_INTERFACE_NAME);
    bus.export(DBUS_ADDRESS, legcordInterface);
    console.info(`registered DBus service at ${DBUS_INTERFACE_NAME} ${DBUS_ADDRESS}`);

    // console.debug(legcordInterface)
}

export function disconnectDbusService(): void {
    bus.disconnect();
}
