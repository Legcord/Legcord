import path from "node:path";
import Url from "node:url";
import { net, app, protocol } from "electron";
protocol.registerSchemesAsPrivileged([
    {
        scheme: "legcord",
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: false,
            bypassCSP: true,
            stream: true,
        },
    },
]);

void app.whenReady().then(() => {
    protocol.handle("legcord", (req) => {
        if (req.url.startsWith("legcord://plugins/")) {
            const url = req.url.replace("legcord://plugins/", "").split("/");
            const filePath = path.join(import.meta.dirname, "plugins", `/${url[0]}/${url[1]}`);
            if (filePath.includes("..")) {
                return new Response("bad", {
                    status: 400,
                    headers: { "content-type": "text/html" },
                });
            }
            return net.fetch(Url.pathToFileURL(filePath).toString());
        } else if (req.url.startsWith("legcord://assets/")) {
            const file = req.url.replace("legcord://assets/", "");
            const filePath = path.join(import.meta.dirname, "assets", "app", `${file}`);
            if (filePath.includes("..")) {
                return new Response("bad", {
                    status: 400,
                    headers: { "content-type": "text/html" },
                });
            }
            return net.fetch(Url.pathToFileURL(filePath).toString());
        } else if (req.url.startsWith("legcord://local/")) {
            const file = req.url.replace("legcord://local/", "");
            const userDataPath = path.join(app.getPath("userData"), "userAssets");
            const filePath = path.normalize(path.join(userDataPath, `${file}`));
            if (!filePath.startsWith(userDataPath)) {
                return new Response("bad", {
                    status: 400,
                    headers: { "content-type": "text/html" },
                });
            }
            return net.fetch(Url.pathToFileURL(filePath).toString());
        }
        return new Response("bad", {
            status: 400,
            headers: { "content-type": "text/html" },
        });
    });
});
