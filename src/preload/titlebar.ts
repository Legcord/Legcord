import { ipcRenderer } from 'electron';
import {addStyle} from '../utils'
import * as fs from 'fs';
import * as path from 'path';
export function injectTitlebar() {
    document.addEventListener("DOMContentLoaded", function (event) {
        var elem = document.createElement("div");
        elem.innerHTML = `<nav class="titlebar">
          <div class="window-title" id="window-title"></div>
          <div id="window-controls-container">
              <div id="minimize"></div>
              <div id="maximize"></div>
              <div id="quit"></div>
          </div>
        </nav>`;
        document.body.appendChild(elem);
        const cssPath = path.join(__dirname, '../', '/content/css/titlebar.css');
        addStyle(fs.readFileSync(
           cssPath,
          "utf8"
        ));
      
        var minimize = document.querySelector("#minimize");
        var maximize = document.querySelector("#maximize");
        var quit = document.querySelector("#quit");
      
        minimize!.addEventListener("click", () => {
          ipcRenderer.sendSync('win-minimize')
        });
      
        maximize!.addEventListener("click", () => {
          if (ipcRenderer.sendSync('win-isMaximized') == true) {
              ipcRenderer.sendSync('win-minimize')
          } else {
              ipcRenderer.sendSync('win-maximize')
          }
        });
      
        quit!.addEventListener("click", () => {
          ipcRenderer.sendSync('win-hide')
        });
      });
}
export function removeTitlebar() {
    document.querySelector('#titlebar')!.remove();
}
