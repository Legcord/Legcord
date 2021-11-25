const { remote } = require("electron");
const currentWindow = remote.getCurrentWindow();
const ArmCord = require("./utils/armcord.js");
const electronLocalshortcut = require("electron-localshortcut");
const bundle = require("./bundle.json");
require("./utils/theme.js");
require("./utils/bridge.js");
require("./utils/titlebar.js");

window.addEventListener("DOMContentLoaded", () => {
	if (require("./utils/armcord.js").Titlebar == "native") {
		console.log("Using native titlebar");
	} else {
		//todo
	}

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
		window.location.href = bundle.supportServer;
	});

	electronLocalshortcut.register(currentWindow, "F4", () => {
		currentWindow.loadFile("./client/manager.html");
	});

	require("./utils/capturer.js");

	ArmCord.addStyle(`
@import url("https://kckarnige.github.io/femboi_owo/discord-font.css");
:root {
  --window-buttons: var(--header-secondary);
  --cord-color: var(--header-primary);
  --armcord-color: #7289da;
  --titlebar-color: var(--background-tertiary);
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
  transform: translate(10px, 0px);
}
.titlebar {
  background: var(--titlebar-color) !important;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
}
.titlebar .window-controls-container .window-icon {
  background: var(--window-buttons) !important;
}
.notice-3bPHh-.colorDefault-22HBa0 {
  display: none;
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

	document.getElementById("ac-channel").innerHTML = ArmCord.Channel;
});
