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
      if (themeFile.theme.endsWith(".scss")) {
        console.log(
          `%cCouldn't load ${themeFile.name} made by ${themeFile.author}. ArmCord doesn't suppot scss files if you want to have this theme ported feel free to reach out https://discord.gg/F25bc4RYDt `,
          "color:red; font-weight: bold; font-size: 50px;color: red;"
        );
      }
      armcord.addStyle(theme);
      console.log(`%cLoaded ${themeFile.name} made by ${themeFile.author}`, "color:red");
    } catch (err) {
      console.error(err);
    }
  });
});
