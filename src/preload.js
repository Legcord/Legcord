const { remote } = require("electron");
const { readFileSync } = require("fs");
const electronLocalshortcut = require("electron-localshortcut");
const ArmCord = require("./utils/armcord.js");
const currentWindow = remote.getCurrentWindow();
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

	electronLocalshortcut.register(currentWindow, "F1", () => {
		require("shell").openExternal("https://support.discord.com/");
	});

	electronLocalshortcut.register(currentWindow, "F2", () => {
		window.location.href = bundle.supportServer;
	});

	electronLocalshortcut.register(currentWindow, "F4", () => {
		currentWindow.loadFile("./client/manager.html");
	});

	electronLocalshortcut.register(currentWindow, "F5", () => {
		location.reload();
	});

	electronLocalshortcut.register(currentWindow, "F6", () => {
		window.location.href = bundle.misc.developers;
	});

	electronLocalshortcut.register(currentWindow, "F12", () => {
		currentWindow.webContents.openDevTools();
	});

	require("./utils/capturer.js");

	ArmCord.addStyle(readFileSync("./styles/preload.css"));
	ArmCord.addStyle(readFileSync("./styles/version.css").replace("<VERSION>", ArmCord.Version));

	document.getElementById("ac-channel").innerHTML = ArmCord.Channel;
});
