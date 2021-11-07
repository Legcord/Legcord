const fs = require("fs");
const { app, session } = require("electron");
const path = require ('path');
const execPath = path.dirname (process.execPath);
app.whenReady().then(() => {
fs.readdirSync(`${execPath}/resources/mods/`).forEach((file) => {
  try {
    const manifest = fs.readFileSync(
      `${execPath}/resources/mods/${file}/manifest.json`,
      "utf8"
    );
    var pluginFile = JSON.parse(manifest);
    session.defaultSession.loadExtension(`${execPath}/resources/mods/${file}`);
    console.log(
      `%cLoaded ${pluginFile.name} made by ${pluginFile.author}`,
      "color:red"
    );
  } catch (err) {
    console.error(err);
  }
});
});
