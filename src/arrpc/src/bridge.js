const ws = require("ws");
const send = (msg) => {
    wss.clients.forEach((x) => x.send(JSON.stringify(msg)));
};

const wss = new ws.WebSocketServer({port: 1337});

module.exports = {send};
