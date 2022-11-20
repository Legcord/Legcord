const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, "arRPC")} > ${rgb(87, 242, 135, "bridge")}]`, ...args);

const {WebSocketServer} = require("ws");
// basic bridge to pass info onto webapp
const send = (msg) => {
    wss.clients.forEach((x) => x.send(JSON.stringify(msg)));
};

const port = 1337;
const wss = new WebSocketServer({port});

wss.on("connection", (socket) => {
    log("web connected");

    socket.on("close", () => {
        log("web disconnected");
    });
});

wss.on("listening", () => log("listening on", port));
module.exports = {send};
