const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, "arRPC")}]`, ...args);

log("arRPC v2.2.0 [ArmCord]");

const {RPCServer} = require("./server.js");
const {mainWindow} = require("../../../ts-out/window.js");

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
