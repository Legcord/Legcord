import { app } from "electron";
import isDev from "electron-is-dev";

export function getVersion(): string {
    if (isDev) {
        return "0.0.0";
    }
    return app.getVersion();
}
export function getDisplayVersion(): string {
    if (isDev) {
        return "Dev Build";
    }
    return app.getVersion();
}
