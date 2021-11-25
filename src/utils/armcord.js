exports.Version = require("../../package.json").version;

const fs = require("fs");
const electron = require("electron");
const userDataPath = (electron.app || electron.remote.app).getPath("userData");
const settingsFile= userDataPath + "/settings.json";

if (!fs.existsSync(settingsFile)) {
  fs.writeFile(settingsFile, "{}", (err) => {
    if (err) throw err;
});
  console.log("Created settings.json file");
};

exports.Channel = require(settingsFile).channel;
exports.Titlebar = require(settingsFile).titlebar;

exports.addStyle = (styleString) => {
 const style = document.createElement('style');
 style.textContent = styleString;
 document.head.append(style);
};

exports.addScript = (scriptString) => {
  const script = document.createElement("script");
  script.textContent = scriptString;
  document.body.append(script);
};
