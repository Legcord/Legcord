import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { interface as dbusInterface, type ProxyInterface, sessionBus, Variant } from "@jellybrick/dbus-next";
import { ACTION_FRIENDLY_NAMES, EXCLUDED_FROM_SHORTCUTS, ValidActions } from "./common/commandDefinitions";
import { handleAction, isValidAction } from "./common/handleCommands";

const { Interface } = dbusInterface;

export const DBUS_INTERFACE_NAME = "app.legcord.Legcord";
export const DBUS_ADDRESS = "/app/legcord/Legcord";

const FREEDESKTOP_PORTAL_NAME = "org.freedesktop.portal.Desktop";
const FREEDESKTOP_PORTAL_ADDRESS = "/org/freedesktop/portal/desktop";

// https://flatpak.github.io/xdg-desktop-portal/docs/doc-org.freedesktop.portal.GlobalShortcuts.html
type Shortcuts = [string, { description: Variant<string> }];
interface GlobalShortcuts extends ProxyInterface {
    CreateSession(options: { handle_token: Variant; session_handle_token: Variant }): Promise<string>;

    ConfigureShortcuts(session_handle: string, parent_window: string, options: object): Promise<string>;

    BindShortcuts(
        session_handle: string,
        shortcuts: Shortcuts[],
        parent_window: string,
        options: {
            handle_token: Variant;
        },
    ): Promise<string>;
}

interface PropertiesInterface extends ProxyInterface {
    Get(interface_name: string, property_name: string): Promise<Variant>;
    Set(interface_name: string, property_name: string, value: Variant): void;
}

interface RegistryInterface extends ProxyInterface {
    Register(app_id: string, options: object): void;
}

// original way of doing it (requires extensive babel plugins and typescript decorators)
// class LegcordInterface extends Interface {
//     @method({ inSignature: "s", outSignature: "", noReply: true, disabled: false })
//     TriggerAction(action: string): void {
//         currentHandler(action);
//     }
// }

// THIS is nescessary only so we don't have to use babel
// plugins all over rolldown.config.ts in every file, and slow down build time.
// https://acrisci.github.io/doc/node-dbus-next/
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

function ensureDesktopFile(): void {
    const dir = join(homedir(), ".local/share/applications");
    const path = join(dir, `${DBUS_INTERFACE_NAME}.desktop`);
    if (existsSync(path)) return;

    mkdirSync(dir, { recursive: true });
    writeFileSync(path, `[Desktop Entry]\nType=Application\nName=Legcord\nExec=${process.execPath}\nNoDisplay=true\n`);
}

function registerAppId(): Promise<void> {
    ensureDesktopFile(); // we need a desktop file at XDG_PATH so we can associate with legcord's app_id
    return bus.getProxyObject("org.freedesktop.portal.Desktop", "/org/freedesktop/portal/desktop").then((portalObj) => {
        const registry: RegistryInterface = portalObj.getInterface("org.freedesktop.host.portal.Registry");
        return registry.Register(DBUS_INTERFACE_NAME, {});
    });
}

export async function setupGlobalShortcuts() {
    const portalObj = await bus.getProxyObject(FREEDESKTOP_PORTAL_NAME, FREEDESKTOP_PORTAL_ADDRESS);

    const properties: PropertiesInterface = portalObj.getInterface("org.freedesktop.DBus.Properties");
    const globalShortcuts: GlobalShortcuts = portalObj.getInterface("org.freedesktop.portal.GlobalShortcuts");

    const freedesktopVersion = (await properties.Get("org.freedesktop.portal.GlobalShortcuts", "version"))
        .value as number;
    console.debug(`Connected with freedesktop portal version ${freedesktopVersion}`);

    await registerAppId();
    console.debug(`Registered ${DBUS_INTERFACE_NAME} in freedesktop Registry.`);

    function awaitResponse(requestPath: string): Promise<Record<string, unknown>> {
        return bus.getProxyObject(FREEDESKTOP_PORTAL_NAME, requestPath).then(
            (requestObj) =>
                new Promise<Record<string, unknown>>((resolve, reject) => {
                    const requestIface = requestObj.getInterface("org.freedesktop.portal.Request");

                    requestIface.once("Response", (responseCode: number, results: Record<string, unknown>) => {
                        if (responseCode === 0) resolve(results);
                        else reject(new Error(`Request failed with code ${responseCode}`));
                    });
                }),
        );
    }

    const sessionRequestPath = await globalShortcuts.CreateSession({
        handle_token: new Variant("s", "legcord_session"),
        session_handle_token: new Variant("s", "legcord_shortcuts"),
    });

    const sessionResult = (await awaitResponse(sessionRequestPath)) as { session_handle: Variant<string> }; // real response signature

    const actionList: [string, { description: Variant<string> }][] = (Object.values(ValidActions) as ValidActions[])
        .filter((action) => !EXCLUDED_FROM_SHORTCUTS.includes(action))
        .map((action) => [action, { description: new Variant("s", ACTION_FRIENDLY_NAMES[action]) }]);

    const sessionHandle = sessionResult.session_handle.value;
    const bindRequestPath = await globalShortcuts.BindShortcuts(sessionHandle, actionList, "", {
        handle_token: new Variant("s", "legcord_bind"),
    });

    await awaitResponse(bindRequestPath);

    globalShortcuts.on("Activated", (activatedSession: string, shortcutId: string) => {
        if (activatedSession !== sessionHandle || !isValidAction(shortcutId)) return;
        handleAction(shortcutId);
    });
}

export async function startDbusService(): Promise<void> {
    await bus.requestName(DBUS_INTERFACE_NAME);
    bus.export(DBUS_ADDRESS, legcordInterface);
    console.info(`Registered DBus service at ${DBUS_INTERFACE_NAME} ${DBUS_ADDRESS}`);

    // console.debug(legcordInterface)
}

export function disconnectDbusService(): void {
    bus.disconnect();
}
