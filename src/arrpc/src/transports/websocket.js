const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, "arRPC")} > ${rgb(235, 69, 158, "websocket")}]`, ...args);
const ws = require("ws");
const {createServer} = require("http");
const querystring = require("querystring");

const portRange = [6463, 6472];

class WSServer {
    constructor(messageHandler, connectionHandler) {
        return new Promise(async (res) => {
            this.messageHandler = messageHandler;
            this.connectionHandler = connectionHandler;

            this.onConnection = this.onConnection.bind(this);
            this.onMessage = this.onMessage.bind(this);

            let port = portRange[0];

            let http, wss;
            while (port <= portRange[1]) {
                try {
                    log("trying port", port);

                    http = createServer();
                    http.on("error", (e) => {
                        log("http error", e);

                        if (e.code === "EADDRINUSE") {
                            log(port, "in use!");
                        }
                    });

                    wss = new ws.WebSocketServer({server: http});
                    wss.on("error", (e) => {
                        log("wss error", e);
                    });

                    wss.on("connection", this.onConnection);

                    http.listen(port, "127.0.0.1", () => {
                        log("listening on", port);

                        this.http = http;
                        this.wss = wss;

                        res(this);
                    });
                } catch (e) {
                    log("failed to start", e);
                }

                break;
            }
        });
    }

    onConnection(socket, req) {
        const params = querystring.parse(req.url.split("?")[1]);
        const ver = parseInt(params.v ?? 1);
        const encoding = params.encoding ?? "json";
        const clientId = params.client_id ?? "";

        const origin = req.headers.origin ?? "";

        log(`new connection! origin:`, origin, JSON.parse(JSON.stringify(params)));

        if (origin !== "") {
            log("origin is defined, denying", origin);

            socket.close();
            return;
        }

        if (encoding !== "json") {
            log("unsupported encoding requested", encoding);

            socket.close();
            return;
        }

        if (ver !== 1) {
            log("unsupported version requested", ver);

            socket.close();
            return;
        }

        if (clientId === "") {
            log("client id required");

            socket.close();
            return;
        }

        socket.clientId = clientId;
        socket.encoding = encoding;

        socket.on("error", (e) => {
            log("socket error", e);
        });

        socket.on("close", (e, r) => {
            log("socket closed", e);
        });

        socket.on("message", this.onMessage.bind(this, socket));

        socket._send = socket.send;
        socket.send = (msg) => {
            log("sending", msg);
            socket._send(JSON.stringify(msg));
        };

        this.connectionHandler(socket);
    }

    onMessage(socket, msg) {
        log("message", JSON.parse(msg));
        this.messageHandler(socket, JSON.parse(msg));
    }
}

module.exports = {WSServer};
