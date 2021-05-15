const customTitlebar = require("custom-electron-titlebar");
const electronLocalshortcut = require("electron-localshortcut");
const { remote } = require("electron");
const ArmCord = require("./utils/ArmCord.js");
require('./utils/theme.js')
window.addEventListener("DOMContentLoaded", () => {
  new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex("#202225"),
    menu: false,
  });

  const currentWindow = remote.getCurrentWindow();
  electronLocalshortcut.register(currentWindow, "F5", () => {
    location.reload();
  });
  electronLocalshortcut.register(currentWindow, "F12", () => {
    currentWindow.webContents.openDevTools();
  });
  electronLocalshortcut.register(currentWindow, "F1", () => {
    require("shell").openExternal("https://support.discord.com/");
  });
  electronLocalshortcut.register(currentWindow, "F2", () => {
    window.location.href = "https://discord.com/invite/F25bc4RYDt";
  });
  electronLocalshortcut.register(currentWindow, "F3", () => {
    currentWindow.loadFile('theme.html')
  });
  require("./utils/capturer.js");
  console.log(
    "%c ArmCord",
    "font-weight: bold; font-size: 50px;color: red; text-shadow: 3px 3px 0 rgb(217,31,38) , 6px 6px 0 rgb(226,91,14) , 9px 9px 0 rgb(245,221,8) , 12px 12px 0 rgb(5,148,68) , 15px 15px 0 rgb(2,135,206) , 18px 18px 0 rgb(4,77,145) , 21px 21px 0 rgb(42,21,113)"
  );
  ArmCord.addStyle(`
@import url("https://kckarnige.github.io/femboi_owo/discord-font.css");
:root {
  --window-buttons: var(--header-secondary);
  --cord-color: var(--header-primary);
  --armcord-color: #7289da;
}
.base-3dtUhz, .sidebar-2K8pFh {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  overflow: hidden;
  border-top-left-radius: 8px;
}
div.menubar[role="menubar"] {
  width: 0px;
}
.window-title:after {
  content: "Cord";
  color: var(--cord-color) !important;
  font-weight: normal;
  font-size: 14px;
  font-family: Discordinated;
}
.window-title:before {
  content: "ARM";
  color: var(--armcord-color);
  font-weight: normal;
  font-size: 14px;
  font-family: Helvetica, sans-serif;
}
.window-title {
  font-size: 0px !important;
  margin-left: initial !important;
  transform: translate(10px, 2px) !important;
}
.titlebar {
  background: var(--background-tertiary) !important;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
}
.titlebar .window-controls-container .window-icon {
  background: var(--window-buttons) !important;
}
`);

  ArmCord.addStyle(
    `.info-1VyQPT:last-child:before {
  content: "ArmCord Version: ` +
      ArmCord.Version +
      `";
  height: auto;
  line-height: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
  text-transform: none;
}`
  );
});
