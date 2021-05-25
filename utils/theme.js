const fs = require("fs");
const {shell} = require('electron');
const ArmCord = require("./ArmCord.js");
const themeFolder = __dirname + "/themes/";

window.addEventListener("DOMContentLoaded", () => {
  console.log("Theme Module Loaded");
  fs.readdirSync(themeFolder).forEach((file) => {
    console.log(file);
    try {
      const manifest = fs.readFileSync(`${__dirname}/themes/${file}/manifest.json`, "utf8");
      var themeFile = JSON.parse(manifest);
      console.log(themeFile.theme);
      console.log(themeFile)
      const theme = fs.readFileSync(`${__dirname}/themes/${file}/${themeFile.theme}`, "utf8");
      if (themeFile.theme.endsWith(".scss")) {
        console.log(
          `%cCouldn't load ${themeFile.name} made by ${themeFile.author}. ArmCord doesn't support SCSS files! If you want to have this theme ported, feel free to reach out https://discord.gg/F25bc4RYDt `,
          "color:red; font-weight: bold; font-size: 50px;color: red;"
        );
      }
      ArmCord.addStyle(theme);
      var html = `<div id="tm-list-item"><div id="theme-name">${themeFile.name}</div><div id="theme-author">By ${themeFile.author}</div><div id="theme-description">${themeFile.description}</div></div><br><br>`;
      document.getElementById("tm-list").innerHTML = html + document.getElementById("tm-list").innerHTML;
      console.log(`%cLoaded ${themeFile.name} made by ${themeFile.author}`, "color:red");
    } catch (err) {
      console.error(err);
    }
  });
  document.getElementById("open-themes-btn").onclick = function () {shell.openPath(`${__dirname}/themes`);};
});
