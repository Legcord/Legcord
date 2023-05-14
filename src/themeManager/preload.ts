import {ipcRenderer} from "electron";
import {sleep} from "../utils";
ipcRenderer.on("themeManifest", (_event, json) => {
    var manifest = JSON.parse(json);
    console.log(manifest);
    sleep(1000);
    var e = document.getElementById("cardBox");
    var id = manifest.name.replace(" ", "-");
    e?.insertAdjacentHTML(
        "beforeend",
        `
        <div class="card">
            <div class="flex-box">
                <h3 id="${id + "header"}">${manifest.name}</h3>
                <input id="${id}" class="tgl tgl-light left" type="checkbox" />
                <label class="tgl-btn left" for="${id}"></label>
            </div>
            <p>${manifest.description}</p>

        </div>
        `
    );
    document.getElementById(id + "header")!.addEventListener("click", () => {
        document.getElementById("themeInfoModal")!.style.display = "block";
        document.getElementById("themeInfoName")!.textContent = `${manifest.name} by ${manifest.author}`;
        document.getElementById("themeInfoDesc")!.textContent = manifest.description + "\n\n" + manifest.version;
        if (manifest.source != undefined)
            document.getElementById(
                "themeInfoButtons"
            )!.innerHTML += `<a href="${manifest.source}" class="button">Source code</a>`;
        if (manifest.website != undefined)
            document.getElementById(
                "themeInfoButtons"
            )!.innerHTML += `<a href="${manifest.website}" class="button">Website</a>`;
        if (manifest.invite != undefined)
            document.getElementById("themeInfoButtons")!.innerHTML += `<a href="${
                "https://discord.gg/" + manifest.invite
            }" class="button">Support Discord</a>`;
    });
    if (!ipcRenderer.sendSync("disabled").includes(id)) {
        (<HTMLInputElement>document.getElementById(id)).checked = true;
    }
    (<HTMLInputElement>document.getElementById(id))!.addEventListener("input", function (evt) {
        ipcRenderer.send("reloadMain");
        if (this.checked) {
            ipcRenderer.send("removeFromDisabled", id);
        } else {
            ipcRenderer.send("addToDisabled", id);
        }
    });
});
document.addEventListener("DOMContentLoaded", () => {
    document.getElementsByClassName("close")[0].addEventListener("click", () => {
        document.getElementById("themeInfoModal")!.style.display = "none";
        document.getElementById("themeInfoButtons")!.innerHTML = "";
    });
    document.getElementById("download")!.addEventListener("click", () => {
        ipcRenderer.send("installBDTheme", (<HTMLInputElement>document.getElementById("themeLink"))!.value);
    });
});
