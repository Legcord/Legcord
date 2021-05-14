const themeFolder = __dirname + "/themes/";
const fs = require("fs");
const armcord = require("./armcord.js")
window.addEventListener("DOMContentLoaded", () => {
fs.readdirSync(themeFolder).forEach((file) => {
  console.log(file);
  try {
    const style = fs.readFileSync(`${__dirname}/themes/${file}`, "utf8");
    armcord.addStyle(style)
  } catch (err) {
    console.error(err);
  }
});
})
