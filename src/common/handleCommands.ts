import { actionDescriptions, ValidActions } from "./commandDefinitions";
import { deafenToggle, leaveCall, muteToggle, openSettings } from "./keybindActions";

export function isValidAction(value: string): value is ValidActions {
    return Object.values(ValidActions).some((action) => value.includes(action));
}

function findValidAction(str: string): ValidActions | undefined {
    return Object.values(ValidActions).find((action) => str.includes(action));
}

function sanitizeArguments(args: string[]): string[] {
    return args.filter((arg) => arg.startsWith("--")).map((arg) => arg.replace("--", ""));
}

/**
 * Did the user pass any valid argument?
 *
 * @export
 * @param {string[]} args List of arguments to validate
 * @return {*}  {boolean}
 */
export function passedValidArgument(args: string[]): boolean {
    if (args.find((arg) => findValidAction(arg))) return true;
    return false;
}

export function handleAction(action: ValidActions): void {
    switch (action) {
        case ValidActions.mute:
            muteToggle();
            break;
        case ValidActions.deafen:
            deafenToggle();
            break;
        case ValidActions.leaveCall:
            leaveCall();
            break;
        case ValidActions.openSettings:
            openSettings();
            break;
        case ValidActions.help:
            showHelpMessage();
            break;
        default: {
            // be completly sure we exaust every action possible at compile-time.
            const exhaustiveCheck: never = action;
            throw new Error(`Unhandled action: ${exhaustiveCheck}`);
        }
    }
}

/**
 * Handles command line arguments and applies actions accordingly, without spawning a new Legcord instance.
 *
 * @export
 * @param {string[]} args List of all arguments to treat as possible commands
 */
export function handleCommands(args: string[]): void {
    const sanitazed_args = sanitizeArguments(args);
    const handledActions = new Set<ValidActions>();

    sanitazed_args.forEach((arg) => {
        if (!arg) return;

        if (!isValidAction(arg)) return;

        const action = findValidAction(arg);
        if (!action || handledActions.has(action)) return;

        console.log(`valid action: ${arg}`);
        handledActions.add(action);
        handleAction(action);
    });
}

function showHelpMessage(): void {
    const entries = Object.entries(actionDescriptions);
    const width = Math.max(...entries.map(([cmd]) => cmd.length));

    console.log("\nAvailable commands (ignore '--' if over dbus):\n");
    for (const [cmd, description] of entries) {
        console.log(`  --${cmd.padEnd(width)}  ${description}`);
    }
    console.log("");
}
