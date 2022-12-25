import {IpcMain, ipcRenderer} from "electron";
interface IPCSources {
    id: string;
    name: string;
    thumbnail: HTMLCanvasElement;
}
async function addDisplays() {
    ipcRenderer.once("getSources", (event, arg) => {
        var sources: IPCSources[] = arg;
        console.log(sources);
        const selectionElem = document.createElement("div");
        //@ts-ignore
        selectionElem.classList = ["desktop-capturer-selection"];
        selectionElem.innerHTML = `<div class="desktop-capturer-selection__scroller">
    <ul class="desktop-capturer-selection__list">
      ${sources
          .map(
              ({id, name, thumbnail}) => `
        <li class="desktop-capturer-selection__item">
          <button class="desktop-capturer-selection__btn" data-id="${id}" title="${name}">
            <img class="desktop-capturer-selection__thumbnail" src="${thumbnail.toDataURL()}" />
            <span class="desktop-capturer-selection__name">${name}</span>
          </button>
        </li>
      `
          )
          .join("")}
      <li class="desktop-capturer-selection__item">
        <button class="desktop-capturer-selection__btn" data-id="screen-cancel" title="Cancel">
          <span class="desktop-capturer-selection__name desktop-capturer-selection__name--cancel">Cancel</span>
        </button>
      </li>
    </ul>
    </div>`;
        document.body.appendChild(selectionElem);
        document.querySelectorAll(".desktop-capturer-selection__btn").forEach((button) => {
            button.addEventListener("click", async () => {
                try {
                    const id = button.getAttribute("data-id");
                    const title = button.getAttribute("title");
                    if (id === "${CANCEL_ID}") {
                        new Error("Cancelled by user");
                    } else {
                        ipcRenderer.sendSync("selectScreenshareSource", id, title);
                    }
                } catch (err) {
                    console.error(err);
                }
            });
        });
    });
}
addDisplays();
