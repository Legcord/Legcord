import fs from "fs";
import path from "path";

const pathToPlugins = path.join(import.meta.dirname,  "..", "ts-out", "plugins");
console.log(pathToPlugins)
fs.readdirSync(pathToPlugins).forEach((file) => {
    const bundle = fs.readFileSync(`${pathToPlugins}/${file}/plugin.js`, "utf8");
    fs.writeFileSync(`${pathToPlugins}/${file}/plugin.js`, bundle.replace(/.*/, "").substr(1));
});
