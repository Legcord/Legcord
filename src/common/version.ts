import {app} from "electron";

export const packageVersion = "3.2.0";

export function getVersion(): string {
    return packageVersion;
}
export function getDisplayVersion(): string {
    //Checks if the app version # has 4 sections (3.1.0.0) instead of 3 (3.1.0) / Shitty way to check if Kernel Mod is installed
    if ((app.getVersion() == packageVersion) == false) {
        if ((app.getVersion() == process.versions.electron) == true) {
            return `Dev Build (${packageVersion})`;
        } else {
            return `${packageVersion} [Modified]`;
        }
    } else {
        return packageVersion;
    }
}
