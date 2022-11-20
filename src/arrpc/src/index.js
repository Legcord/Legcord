const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, "arRPC")}]`, ...args);

log("arRPC v1.1.0-beta ArmCord");

const Bridge = require("./bridge.js");
const {RPCServer} = require("./server.js");
const fetch = require("cross-fetch");
const {mainWindow} = require("../../../ts-out/window.js");
const {sleep} = require("../../../ts-out/utils.js");

async function run() {
    const server = await new RPCServer();
    server.on("activity", (data) => mainWindow.webContents.send("rpc", data));
    server.on("invite", (code) => {
        console.log(code);
        const {createInviteWindow, inviteWindow} = require("../../../ts-out/window.js");
        const {exportPort} = require("./transports/websocket.js");
        createInviteWindow();
        const win = inviteWindow;
        //doesnt work
        win.loadURL("https://discord.com/invite/" + code);
        win.show();
    });
}
run();
//server.on('activity', data => Bridge.send(data));
