const themeFolder = __dirname + "/themes/";
const fs = require("fs");
const armcord = require("./armcord.js")
fs.readdirSync(themeFolder).forEach((file) => {
  armcord.addStyle(fs.readFileSync(file))
  console.log(file)
});
