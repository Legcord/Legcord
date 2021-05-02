// This desktop capturer has been taken from https://github.com/SpacingBat3/electron-discord-webapp


/*
 * Thanks, @WesselKroos!
 */

/*function l10n(origin, locale){
  if(originalString == 'Entire Screen') {
    return locale;
  } else {
    return origin;
  }
}*/
const { desktopCapturer } = require("electron");

navigator.mediaDevices.getDisplayMedia = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ["screen", "window"],
      });
      const selectionElem = document.createElement("div");
      selectionElem.setAttribute("class", "desktop-capturer-selection");
      selectionElem.innerHTML = `
        <style>
        .desktop-capturer-selection {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: rgba(30,30,30,.75);
          color: #fff;
          z-index: 10000000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .desktop-capturer-selection__scroller {
          width: 100%;
          max-height: 100vh;
          overflow-y: auto;
        }
        .desktop-capturer-selection__list {
          max-width: calc(100% - 100px);
          margin: 50px;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          list-style: none;
          overflow: hidden;
          justify-content: center;
        }
        .desktop-capturer-selection__item {
          display: flex;
          margin: 4px;
        }
        .desktop-capturer-selection__btn {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          width: 145px;
          margin: 0;
          border: 0;
          border-radius: 3px;
          padding: 4px;
          color: #FFFFFF;
          background: #36393F;
          text-align: left;
          transition: background-color .15s, box-shadow .15s;
        }
        .desktop-capturer-selection__btn:hover,
        .desktop-capturer-selection__btn:focus {
          background: #7289DA;
        }
        .desktop-capturer-selection__thumbnail {
          width: 100%;
          height: 81px;
          object-fit: cover;
        }
        .desktop-capturer-selection__name {
          margin: 6px 0 6px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .desktop-capturer-close {
          background-color: #36393F;
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          right: 15px;
          padding-top: 5px;
          transition: background-color .15s;
        }
        .desktop-capturer-close:hover {
          background-color: #823A3A;
        }
        </style>
        <div class="desktop-capturer-selection__scroller">
          <ul class="desktop-capturer-selection__list">
            ${sources
              .map(
                ({ id, name, thumbnail }) => `
              <li class="desktop-capturer-selection__item">
                <button class="desktop-capturer-selection__btn" data-id="${id}" title="${name}">
                  <img class="desktop-capturer-selection__thumbnail" src="${thumbnail.toDataURL()}" />
                  <span class="desktop-capturer-selection__name">${name}</span>
                </button>
              </li>
            `
              )
              .join("")}
          </ul>
          <button class="desktop-capturer-close">
            <svg viewBox="0 0 10 10" height=20px>
              <line x1="0" y1="10" x2="10" y2="0" stroke="white" />
              <line x1="0" y1="0" x2="10" y2="10" stroke="white" />
            </svg>
          </button>
        </div>
      `;
      document.body.appendChild(selectionElem);

      document
        .querySelectorAll(".desktop-capturer-selection__btn")
        .forEach((button) => {
          button.addEventListener("click", async () => {
            try {
              const id = button.getAttribute("data-id");
              const source = sources.find((source) => source.id === id);
              if (!source) {
                throw new Error(`Source with id ${id} does not exist`);
              }
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                  mandatory: {
                    chromeMediaSource: "desktop",
                    chromeMediaSourceId: source.id,
                  },
                },
              });
              resolve(stream);
              selectionElem.remove();
            } catch (err) {
              console.error("Error selecting desktop capture source:", err);
              reject(err);
            }
          });
        });
      document.querySelectorAll(".desktop-capturer-close").forEach((button) => {
        button.addEventListener("click", () => {
          selectionElem.remove();
        });
      });
    } catch (err) {
      console.error("Error displaying desktop capture sources:", err);
      reject(err);
    }
  });
};
console.log("Desktop capturer has been preloaded 🎉️");
