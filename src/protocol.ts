import {app, net, protocol} from "electron";
import path from "path";
import Url from "url";

protocol.registerSchemesAsPrivileged([
    {
        scheme: "armcord",
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: false,
            bypassCSP: true
        }
    }
]);

void app.whenReady().then(() => {
    protocol.handle("armcord", (req) => {
        const url = req.url.replace("armcord://plugins/", "").split("/");
        const filePath = path.join(import.meta.dirname, "plugins", `/${url[0]}/${url[1]}`);
        if (filePath.includes("..")) {
            return new Response("bad", {
                status: 400,
                headers: {"content-type": "text/html"}
            });
        }
        return net.fetch(Url.pathToFileURL(filePath).toString());
    });
});
