import {app} from "electron";

export function getVersion(): string {
    if ((app.getVersion() == process.versions.electron) == true) {
        return "3.3.0";
    }
    return app.getVersion();
}
export function getDisplayVersion(): string {
    if ((app.getVersion() == process.versions.electron) == true) {
        return "Dev Build";
    }
    return app.getVersion();
}
