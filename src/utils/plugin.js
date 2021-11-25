const fs = require("fs");
const { app, session } = require("electron");
const electron = require("electron");
const userDataPath = (electron.app || electron.remote.app).getPath("userData");
const pluginFolder = userDataPath + "/plugins/";

app.whenReady().then(() => {
fs.readdirSync(pluginFolder).forEach((file) => {
  try {
    const manifest = fs.readFileSync(
      `${userDataPath}/plugins/${file}/manifest.json`,
      "utf8"
    );
    
    const pluginFile = JSON.parse(manifest);
    session.defaultSession.loadExtension(`${userDataPath}/plugins/${file}`);
    console.log(
      `%cLoaded ${pluginFile.name} made by ${pluginFile.author}`,
      "color:red"
    );
  } catch (err) {
    console.error(err);
  }
});
});
