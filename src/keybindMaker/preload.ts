import {contextBridge, ipcRenderer} from "electron";
import {sleep} from "../utils";
contextBridge.exposeInMainWorld("manager", {
    add: (keybindName: string) => ipcRenderer.send("addKeybind", keybindName),
    remove: (keybindName: string) => ipcRenderer.send("removeKeybind", keybindName)
});
ipcRenderer.on("keybindCombo", (_event, keybindName) => {
    sleep(1000);
    console.log(keybindName);
    let e = document.getElementById("cardBox");
    var keys = keybindName.split("+");
    var id = keybindName.replace("+", "");
    var html = "";
    for (var key in keys) {
        html += `<kbd>${keys[key]}</kbd>`;
    }
    e?.insertAdjacentHTML(
        "beforeend",
        `
        <div class="card">
                <div class="flex-box">
                    ${html}
                    <input id="${id}" class="tgl tgl-light left" type="checkbox" />
                    <label class="tgl-btn left" for="${id}"></label>
                </div>
            </div>
        `
    );
    (document.getElementById(id) as HTMLInputElement)!.checked = true;
    (document.getElementById(id) as HTMLInputElement)!.addEventListener("input", function (evt) {
        ipcRenderer.send("removeKeybind", keybindName);
    });
});
sleep(3000).then(() => {
    document.getElementById("warning")!.style.display = "none";
});
