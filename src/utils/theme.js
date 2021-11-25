const fs = require("fs");
const { shell } = require("electron");
const electron = require("electron");
const ArmCord = require("./armcord.js");
const bundle = require("../bundle.json");
const userDataPath = (electron.app || electron.remote.app).getPath("userData");
const themeFolder = userDataPath + "/themes/";

if (!fs.existsSync(themeFolder)) {
	fs.mkdirSync(themeFolder);
	console.log("Created theme folder");
};

window.addEventListener("DOMContentLoaded", () => {
	console.log("Theme Module Loaded"); // I KNOW THIS IS A MESS BUT IT'S WORKING MESS, XOXO

	fs.readdirSync(themeFolder).forEach((file) => {
		try {
			if (file.includes("DISABLED")) {
				console.log(`Skipping ${file}.`);
				const manifest = fs.readFileSync(`${userDataPath}/themes/${file}/manifest.json`, "utf8");
				var themeFile = JSON.parse(manifest);
				var html = `<div id="tm-list-item"><div id="theme-name">${themeFile.name}</div><div id="theme-author">By ${themeFile.author}</div><div id="theme-description">${themeFile.description}</div></div><br><br>`;
				document.getElementById("tm-disabled").innerHTML = html + document.getElementById("tm-disabled").innerHTML;
			};

			const manifest = fs.readFileSync(`${userDataPath}/themes/${file}/manifest.json`, "utf8");
			var themeFile = JSON.parse(manifest);
			const theme = fs.readFileSync(`${userDataPath}/themes/${file}/${themeFile.theme}`, "utf8");

			if (themeFile.theme.endsWith(".scss")) {
				console.log(
					`%cCouldn't load ${themeFile.name} made by ${themeFile.author}. ArmCord doesn't support SCSS files! If you want to have this theme ported, feel free to reach out https://discord.gg/F25bc4RYDt `,
					"color:red; font-weight: bold; font-size: 50px;color: red;"
				)};
        
			ArmCord.addStyle(theme);
			var html = `<div id="tm-list-item"><div id="theme-name">${themeFile.name}</div><div id="theme-author">By ${themeFile.author}</div><div id="theme-description">${themeFile.description}</div></div><br><br>`;
			document.getElementById("tm-list").innerHTML = html + document.getElementById("tm-list").innerHTML;
			console.log(`%cLoaded ${themeFile.name} made by ${themeFile.author}`, "color:red");
		} catch (err) {
			console.error(err);
		}
	});

	document.getElementById("open-themes-btn").onclick = function () {
		shell.openPath(`${userDataPath}/themes`);
	};

	document.getElementsByClassName("back-btn")[0].onclick = function () {
    let channel = document.getElementById("ac-channel").innerHTML;
    let href = window.location.href;

    href = bundle.channels[channel];
	};
});
