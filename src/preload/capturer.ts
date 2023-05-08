//Fixed context isolation version https://github.com/getferdi/ferdi/blob/develop/src/webview/screenshare.ts
//original https://github.com/electron/electron/issues/16513#issuecomment-602070250
import {addScript, addStyle} from "../utils";
import fs from "fs";
import path from "path";

const CANCEL_ID = "desktop-capturer-selection__cancel";

const screenShareJS = `
window.navigator.mediaDevices.getDisplayMedia = () => new Promise(async (resolve, reject) => {
  try {
    const selectionElem = document.createElement('div');
    selectionElem.classList = ['desktop-capturer-selection'];
    selectionElem.innerHTML = await window.armcord.getDisplayMediaSelector();
    document.body.appendChild(selectionElem);
    document
      .querySelectorAll('.desktop-capturer-selection__btn')
      .forEach((button) => {
        button.addEventListener('click', async () => {
          try {
            const id = button.getAttribute('data-id');
            if (id === '${CANCEL_ID}') {
              reject(new Error('Cancelled by user'));
            } else {
              const stream = await window.navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                  mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: id,
                  },
                },
              });
              resolve(stream);
            }
          } catch (err) {
            reject(err);
          } finally {
            selectionElem.remove();
          }
        });
      });
  } catch (err) {
    reject(err);
  }
});
`;

document.addEventListener("DOMContentLoaded", function () {
    addScript(screenShareJS);
    const screenshareCss = path.join(__dirname, "../", "/content/css/screenshare.css");
    addStyle(fs.readFileSync(screenshareCss, "utf8"));
    console.log("Capturer injected.");
});
