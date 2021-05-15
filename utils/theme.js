const fs = require("fs");
const armcord = require("./armcord.js");
const themeFolder = __dirname + "/themes/";
window.addEventListener("DOMContentLoaded", () => {
  fs.readdirSync(themeFolder).forEach((file) => {
    console.log(file);
    try {
      const manifest = fs.readFileSync(`${__dirname}/themes/${file}/manifest.json`, "utf8");
      var themeFile = JSON.parse(manifest);
      console.log(themeFile.theme);
      console.log(themeFile)
      const theme = fs.readFileSync(`${__dirname}/themes/${file}/${themeFile.theme}`, "utf8");
      armcord.addStyle(theme);
      console.log(`%cLoaded ${themeFile.name} made by ${themeFile.author}`, "color:red");
    } catch (err) {
      console.error(err);
    }
  });
});
