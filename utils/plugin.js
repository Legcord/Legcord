const fs = require("fs");
const { app, session } = require("electron");
const pluginFolder = __dirname + "/plugins/";
app.whenReady().then(() => {
fs.readdirSync(pluginFolder).forEach((file) => {
  console.log(file);
  try {
    const manifest = fs.readFileSync(
      `${__dirname}/plugins/${file}/manifest.json`,
      "utf8"
    );
    var pluginFile = JSON.parse(manifest);
    console.log(pluginFile);
    session.defaultSession.loadExtension(`${__dirname}\\plugins\\${file}`);
    console.log(
      `%cLoaded ${pluginFile.name} made by ${pluginFile.author}`,
      "color:red"
    );
  } catch (err) {
    console.error(err);
  }
});
});
