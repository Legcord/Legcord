import * as dbus from '@jellybrick/dbus-next';
import { ValidActions } from './externalCommands';

const bus = dbus.sessionBus();

const COMPONENT_UNIQUE = 'legcord-client'
const COMPONENT_FRIENDLY = 'Legcord';

const kglobalaccelProxy = await bus.getProxyObject('org.kde.kglobalaccel', '/kglobalaccel');
const kglobalaccel = kglobalaccelProxy.getInterface('org.kde.KGlobalAccel');

// KGlobalAccel expects a 4-element action identifier:
// [componentUnique, actionUnique, componentFriendly, actionFriendly]
type KGlobalAccelActionId = [
    componentUnique: string,
    actionUnique: string,
    componentFriendly: string,
    actionFriendly: string,
];

// we don't need a 'show help' shortcut do we? be fr
const EXCLUDED_FROM_SHORTCUTS: ValidActions[] = [ValidActions.help];

const ACTION_FRIENDLY_NAMES: Record<ValidActions, string> = {
    [ValidActions.mute]: 'Toggle Mute',
    [ValidActions.deafen]: 'Toggle Deafen',
    [ValidActions.leaveCall]: 'Leave Call',
    [ValidActions.openSettings]: 'Open Settings',
    [ValidActions.help]: 'ignore (help)',
};

function buildActionId(action: ValidActions): KGlobalAccelActionId {
    return [COMPONENT_UNIQUE, action, COMPONENT_FRIENDLY, ACTION_FRIENDLY_NAMES[action]];
}


interface KGlobalAccelInterface {
    doRegister(actionId: string[]): void;
    getComponent(componentUnique: string): Promise<string>;
    
    // list available dbus exposed methods with 'qdbus org.kde.kglobalaccel /kglobalaccel'
}

async function registerKGlobalAccelAction(actionId: KGlobalAccelActionId) {
    const iface = kglobalaccelProxy.getInterface('org.kde.KGlobalAccel');
    // biome-ignore lint/suspicious/noExplicitAny: doRegister is a method that exists only at runtime by kglobalaccel.
    await (iface as any as KGlobalAccelInterface).doRegister(actionId);
    console.log(`Registered "${actionId[3]}" under KDE Shortcuts (${COMPONENT_FRIENDLY})`)
}

export function KGlobalAccelRegisterShortcuts(): void {
    const allActions = (Object.values(ValidActions) as ValidActions[])
        .filter((action) => !EXCLUDED_FROM_SHORTCUTS.includes(action));

    allActions.forEach((action) => {
            registerKGlobalAccelAction(buildActionId(action))
        },
    )

    listenForShortcutActivations(COMPONENT_UNIQUE, (actionUnique) => {
        console.warn(`Received action from kglobalaccel: ${actionUnique}`);
    });
}

async function listenForShortcutActivations(
    componentUnique: string,
    onAction: (actionUnique: string) => void,
) {
    try {
        const componentIface = kglobalaccelProxy.getInterface('org.kde.KGlobalAccel'); // <-- still needs verifying via introspection

        componentIface.on('globalShortcutPressed', (component: string, action: string, _timestamp: bigint) => {
            onAction(action);
        });
    } catch (err) {
        console.error('Failed to listen for shortcut activations:', err);
    }
}