import {ipcRenderer} from "electron";
import {sleep} from "../utils";
ipcRenderer.on("themeManifest", (_event, json) => {
    let manifest = JSON.parse(json);
    console.log(manifest);
    sleep(1000);
    let e = document.getElementById("cardBox");
    let id = manifest.name.replace(" ", "-");
    e?.insertAdjacentHTML(
        "beforeend",
        `
        <div class="card">
            <div class="flex-box">
                <h3 id="${`${id}header`}">${manifest.name}</h3>
                <input id="${id}" class="tgl tgl-light left" type="checkbox" />
                <label class="tgl-btn left" for="${id}"></label>
            </div>
            <p>${manifest.description}</p>
        </div>
        `
    );
    document.getElementById(`${id}header`)!.addEventListener("click", () => {
        document.getElementById("themeInfoModal")!.style.display = "block";
        document.getElementById("themeInfoName")!.textContent = `${manifest.name} by ${manifest.author}`;
        document.getElementById("themeInfoDesc")!.textContent = `${manifest.description}\n\n${manifest.version}`;
        if (manifest.supportsArmCordTitlebar !== undefined) {
            document.getElementById(
                "themeInfoButtons"
            )!.innerHTML += `<img class="themeInfoIcon" id="removeTheme" alt="Remove the theme" src="https://raw.githubusercontent.com/ArmCord/BrandingStuff/main/Trash.png"></img>
                           <img class="themeInfoIcon" id="updateTheme" alt="Update your theme" src="https://raw.githubusercontent.com/ArmCord/BrandingStuff/main/UpgradeArrow.png"></img>
                           <img class="themeInfoIcon" id="compatibility" alt="Supports ArmCord Titlebar" src=""></img>`;
            console.log("e");
            if (manifest.supportsArmCordTitlebar == true) {
                (document.getElementById(`compatibility`) as HTMLImageElement).src =
                    "https://raw.githubusercontent.com/ArmCord/BrandingStuff/main/Window.png";
            } else {
                (document.getElementById(`compatibility`) as HTMLImageElement).src =
                    "https://raw.githubusercontent.com/ArmCord/BrandingStuff/main/WindowUnsupported.png";
            }
            document.getElementById("removeTheme")!.addEventListener("click", () => {
                ipcRenderer.send("", id + "-BD");
                document.getElementById("themeInfoModal")!.style.display = "none";
                document.getElementById("themeInfoButtons")!.innerHTML = "";
            });
            document.getElementById(`updateTheme`)!.addEventListener("click", () => {
                console.log("Updating " + manifest.name);
                ipcRenderer.send("installBDTheme", manifest.updateSrc);
                document.getElementById("themeInfoModal")!.style.display = "none";
                document.getElementById("themeInfoButtons")!.innerHTML = "";
            });
        }
        if (manifest.source != undefined)
            document.getElementById(
                "themeInfoButtons"
            )!.innerHTML += `<a href="${manifest.source}" class="button">Source code</a>`;
        if (manifest.website != undefined)
            document.getElementById(
                "themeInfoButtons"
            )!.innerHTML += `<a href="${manifest.website}" class="button">Website</a>`;
        if (manifest.invite != undefined)
            document.getElementById(
                "themeInfoButtons"
            )!.innerHTML += `<a href="${`https://discord.gg/${manifest.invite}`}" class="button">Support Discord</a>`;
    });
    if (!ipcRenderer.sendSync("disabled").includes(id)) {
        (document.getElementById(id) as HTMLInputElement).checked = true;
    }
    (document.getElementById(id) as HTMLInputElement)!.addEventListener("input", function (evt) {
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
        ipcRenderer.send("installBDTheme", (document.getElementById("themeLink") as HTMLInputElement)!.value);
    });
});
