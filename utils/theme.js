const themeFolder = __dirname + "/themes/";
const fs = require("fs");
const armcord = require("./armcord.js");
const splitRegex = /[^\S\r\n]*?\r?(?:\r\n|\n)[^\S\r\n]*?\*[^\S\r\n]?/;
const escapedAtRegex = /^\\@/;
function parseMeta(fileContent) {
  //https://github.com/rauenzi/BetterDiscordApp/blob/01941c1178c13e1229e39e1f1434678a39a020b8/renderer/src/modules/addonmanager.js
  const block = fileContent.split("/**", 2)[1].split("*/", 1)[0];
  const out = {};
  let field = "";
  let accum = "";
  for (const line of block.split(splitRegex)) {
    if (line.length === 0) continue;
    if (line.charAt(0) === "@" && line.charAt(1) !== " ") {
      out[field] = accum;
      const l = line.indexOf(" ");
      field = line.substr(1, l - 1);
      accum = line.substr(l + 1);
    } else {
      accum += " " + line.replace("\\n", "\n").replace(escapedAtRegex, "@");
    }
  }
  out[field] = accum.trim();
  delete out[""];
  out.format = "jsdoc";
  return out;
}
function loadPluginMenu() {
  window.addEventListener("DOMContentLoaded", () => {
    fs.readdirSync(themeFolder).forEach((file) => {
      console.log(file);
      try {
        const style = fs.readFileSync(`${__dirname}/themes/${file}`, "utf8");
        document.getElementById("tm-list").appendChild(
            `
            <p>${parseMeta(style)}</p>
            `
        );
      } catch (err) {
        console.error(err);
      }
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadPluginMenu()
  fs.readdirSync(themeFolder).forEach((file) => {
    console.log(file);
    try {
      const style = fs.readFileSync(`${__dirname}/themes/${file}`, "utf8");
      armcord.addStyle(style);
    } catch (err) {
      console.error(err);
    }
  });
});
