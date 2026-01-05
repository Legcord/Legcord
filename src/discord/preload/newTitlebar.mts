const { ipcRenderer } = require("electron");
import { addStyle } from "../../common/dom.js";

const windowStyle = ipcRenderer.sendSync("getConfig", "windowStyle");
if (windowStyle === "default" || windowStyle === "overlay") {
    document.addEventListener("DOMContentLoaded", () => {
        const os = ipcRenderer.sendSync("getOS");
        document.body.setAttribute("legcord-platform", os);
        addStyle("legcord://assets/css/baseTitlebar.css");
        switch (os) {
            case "darwin":
                // breaks traffic lights with bar__ and hidden__ classes
                // document.body.setAttribute("class", "platform-osx");
                addStyle("legcord://assets/css/darwinTitlebar.css");
                break;
            case "win32":
                document.body.setAttribute("class", "platform-win");
                addStyle("legcord://assets/css/winTitlebar.css");
                break;
            case "linux":
                document.body.setAttribute("class", "platform-linux");
                addStyle("legcord://assets/css/linuxTitlebar.css");
                break;
            default:
                break;
        }
    });
}
