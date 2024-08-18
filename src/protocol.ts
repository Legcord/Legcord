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
        // TODO - strict path checking, only allow stuff to load from the plugins folder
        return net.fetch(
            Url.pathToFileURL(path.join(import.meta.dirname, "plugins", `/${url[0]}/${url[1]}`))
                .toString()
                .replace('"use strict";', "")
        );
    });
});
