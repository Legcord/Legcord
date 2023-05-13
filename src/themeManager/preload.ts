import {ipcRenderer} from "electron";
import {sleep} from "../utils";
ipcRenderer.on("themeManifest", (_event, json) => {
    var manifest = JSON.parse(json);
    console.log(manifest);
    sleep(1000);
    var e = document.getElementById("cardBox");

    e?.insertAdjacentHTML(
        "beforeend",
        `
        <div class="card">
            <div class="flex-box">
                <h3>${manifest.name}</h3>
                <input id="${manifest.name.replace(" ", "-")}" class="tgl tgl-light left" type="checkbox" />
                <label class="tgl-btn left" for="${manifest.name.replace(" ", "-")}"></label>
            </div>
            <p>${manifest.description}</p>

        </div>
        `
    );

    if (!ipcRenderer.sendSync("disabled").includes(manifest.name.replace(" ", "-"))) {
        (<HTMLInputElement>document.getElementById(manifest.name.replace(" ", "-"))).checked = true;
    }
    (<HTMLInputElement>document.getElementById(manifest.name.replace(" ", "-")))!.addEventListener(
        "input",
        function (evt) {
            ipcRenderer.send("reloadMain");
            if (this.checked) {
                ipcRenderer.send("removeFromDisabled", manifest.name.replace(" ", "-"));
            } else {
                ipcRenderer.send("addToDisabled", manifest.name.replace(" ", "-"));
            }
        }
    );
});
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("download")!.addEventListener("click", () => {
        ipcRenderer.send("installBDTheme", (<HTMLInputElement>document.getElementById("themeLink"))!.value);
    });
});
