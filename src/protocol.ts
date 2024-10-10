import fs from "node:fs";
import path from "node:path";
import Url from "node:url";
import { net, app, protocol } from "electron";
protocol.registerSchemesAsPrivileged([
    {
        scheme: "armcord",
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
    protocol.handle("armcord", (req) => {
        if (req.url.startsWith("armcord://plugins/")) {
            const url = req.url.replace("armcord://plugins/", "").split("/");
            const filePath = path.join(import.meta.dirname, "plugins", `/${url[0]}/${url[1]}`);
            if (filePath.includes("..")) {
                return new Response("bad", {
                    status: 400,
                    headers: { "content-type": "text/html" },
                });
            }
            return net.fetch(Url.pathToFileURL(filePath).toString());
        } else if (req.url.startsWith("armcord://assets/")) {
            const file = req.url.replace("armcord://assets/", "");
            const filePath = path.join(import.meta.dirname, "assets", "app", `${file}`);
            if (filePath.includes("..")) {
                return new Response("bad", {
                    status: 400,
                    headers: { "content-type": "text/html" },
                });
            }
            return net.fetch(Url.pathToFileURL(filePath).toString());
        } else if (req.url.startsWith("armcord://local/")) {
            const file = req.url.replace("armcord://local/", "");
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
