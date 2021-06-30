const fs = require("fs");
const { app, session } = require("electron");
const electron = require("electron");
const userDataPath = (electron.app || electron.remote.app).getPath("userData");
const pluginFolder = userDataPath + "/plugins/";
if (!fs.existsSync(pluginFolder)) {
  fs.mkdirSync(pluginFolder);
  console.log("Created plugin folder")
  try {
  console.log("Attempting to download GooseMod Extension")
  const https = require("https");

  function download(url, dest, cb) {
    const file = fs.createWriteStream(dest);
    const request = https
      .get(url, function (response) {
        response.pipe(file);
        file.on("finish", function () {
          file.close(cb); // close() is async, call cb after close completes.
        });
      })
      .on("error", function (err) {
        // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        if (cb) cb(err.message);
      });
  }

  // Download latest archive from GitHub to temp folder
  const dest = userDataPath + "/Cache/GooseMod.zip";
  const url =
    "https://codeload.github.com/GooseMod/Extension/zip/refs/heads/main";
  download(url, dest, function () {
    console.log("Downloaded, attempting to install.");
    const unzip = require("unzipper")
    fs.createReadStream(dest).pipe(unzip.Extract({ path: pluginFolder }));
    console.log("Success! GooseMod will start on next session!")
  });
  }
  catch (e){
    console.error(`GooseMod failed to download. Error: ${e}`)
  }
}
app.whenReady().then(() => {
fs.readdirSync(pluginFolder).forEach((file) => {
  console.log(file);
  try {
    const manifest = fs.readFileSync(
      `${userDataPath}/plugins/${file}/manifest.json`,
      "utf8"
    );
    var pluginFile = JSON.parse(manifest);
    console.log(pluginFile);
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
