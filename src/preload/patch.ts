// What does this do?
// In case of faulty update of ArmCord we can quickly push an update to the user and possibly try to fix it
// This is completely optional and is disabled by default in settings
import {ipcRenderer} from "electron";
import {injectJS} from "../utils";

const patchEndpoint = "https://patch.armcord.xyz";
const version = ipcRenderer.sendSync("get-app-version", "app-version");
if (ipcRenderer.sendSync("shouldPatch")) {
    document.addEventListener("DOMContentLoaded", function () {
        fetch(`${patchEndpoint}/${version}/info.json`, {cache: "no-store"}) //lmao
            .then((res) => res.json())
            .then((res) => {
                if (res.patch == true) {
                    console.log("Found a patch. Injecting...");
                    injectJS(`${patchEndpoint}/${version}/patch.js`);
                } else {
                    console.log("No patches have been found.");
                }
            });
    });
}
