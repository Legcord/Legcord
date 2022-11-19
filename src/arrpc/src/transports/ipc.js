const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, "arRPC")} > ${rgb(254, 231, 92, "ipc")}]`, ...args);
const path = require("path");
const {platform, env} = require("process");
const {unlinkSync} = require("fs");
const {createServer, createConnection} = require("net");

const SOCKET_PATH =
    platform === "win32"
        ? "\\\\?\\pipe\\discord-ipc"
        : path.join(env.XDG_RUNTIME_DIR || env.TMPDIR || env.TMP || env.TEMP || "/tmp", "discord-ipc");

const Types = {
    HANDSHAKE: 0,
    FRAME: 1,
    CLOSE: 2,
    PING: 3,
    PONG: 4
};

const CloseCodes = {
    CLOSE_NORMAL: 1000,
    CLOSE_UNSUPPORTED: 1003,
    CLOSE_ABNORMAL: 1006
};

const ErrorCodes = {
    INVALID_CLIENTID: 4000,
    INVALID_ORIGIN: 4001,
    RATELIMITED: 4002,
    TOKEN_REVOKED: 4003,
    INVALID_VERSION: 4004,
    INVALID_ENCODING: 4005
};

let uniqueId = 0;

const encode = (type, data) => {
    data = JSON.stringify(data);
    const dataSize = Buffer.byteLength(data);

    const buf = Buffer.alloc(dataSize + 8);
    buf.writeInt32LE(type, 0); // type
    buf.writeInt32LE(dataSize, 4); // data size
    buf.write(data, 8, dataSize); // data

    return buf;
};

const read = (socket) => {
    let resp = socket.read(8);
    if (!resp) return;

    resp = Buffer.from(resp);
    const type = resp.readInt32LE(0);
    const dataSize = resp.readInt32LE(4);

    if (type < 0 || type >= Object.keys(Types).length) throw new Error("invalid type");

    let data = socket.read(dataSize);
    if (!data) throw new Error("failed reading data");

    data = JSON.parse(Buffer.from(data).toString());

    switch (type) {
        case Types.PING:
            socket.emit("ping", data);
            socket.write(encode(Types.PONG, data));
            break;

        case Types.PONG:
            socket.emit("pong", data);
            break;

        case Types.HANDSHAKE:
            if (socket._handshook) throw new Error("already handshook");

            socket._handshook = true;
            socket.emit("handshake", data);
            break;

        case Types.FRAME:
            if (!socket._handshook) throw new Error("need to handshake first");

            socket.emit("request", data);
            break;

        case Types.CLOSE:
            socket.end();
            socket.destroy();
            break;
    }

    read(socket);
};

const socketIsAvailable = async (socket) => {
    socket.pause();
    socket.on("readable", () => {
        try {
            read(socket);
        } catch (e) {
            log("error whilst reading", e);

            socket.end(
                encode(Types.CLOSE, {
                    code: CloseCodes.CLOSE_UNSUPPORTED,
                    message: e.message
                })
            );
            socket.destroy();
        }
    });

    const stop = () => {
        try {
            socket.end();
            socket.destroy();
        } catch {}
    };

    const possibleOutcomes = Promise.race([
        new Promise((res) => socket.on("error", res)), // errore
        new Promise((res, rej) => socket.on("pong", () => rej("socket ponged"))), // ponged
        new Promise((res, rej) => setTimeout(() => rej("timed out"), 1000)) // timed out
    ]).then(
        () => true,
        (e) => e
    );

    socket.write(encode(Types.PING, ++uniqueId));

    const outcome = await possibleOutcomes;
    stop();
    log("checked if socket is available:", outcome === true, outcome === true ? "" : `- reason: ${outcome}`);

    return outcome === true;
};

const getAvailableSocket = async (tries = 0) => {
    if (tries > 9) {
        throw new Error("ran out of tries to find socket", tries);
    }

    const path = SOCKET_PATH + "-" + tries;
    const socket = createConnection(path);

    log("checking", path);

    if (await socketIsAvailable(socket)) {
        if (platform !== "win32")
            try {
                unlinkSync(path);
            } catch {}

        return path;
    }

    log(`not available, trying again (attempt ${tries + 1})`);
    return getAvailableSocket(tries + 1);
};

class IPCServer {
    constructor(messageHandler, connectionHandler) {
        return new Promise(async (res) => {
            this.messageHandler = messageHandler;
            this.connectionHandler = connectionHandler;

            this.onConnection = this.onConnection.bind(this);
            this.onMessage = this.onMessage.bind(this);

            const server = createServer(this.onConnection);
            server.on("error", (e) => {
                log("server error", e);
            });

            const socketPath = await getAvailableSocket();
            server.listen(socketPath, () => {
                log("listening at", socketPath);
                this.server = server;

                res(this);
            });
        });
    }

    onConnection(socket) {
        log("new connection!");

        socket.pause();
        socket.on("readable", () => {
            try {
                read(socket);
            } catch (e) {
                log("error whilst reading", e);

                socket.end(
                    encode(Types.CLOSE, {
                        code: CloseCodes.CLOSE_UNSUPPORTED,
                        message: e.message
                    })
                );
                socket.destroy();
            }
        });

        socket.once("handshake", (params) => {
            log("handshake:", params);

            const ver = params.v ?? 1;
            const clientId = params.client_id ?? "";

            if (ver !== 1) {
                log("unsupported version requested", ver);

                socket.close(ErrorCodes.INVALID_VERSION);
                return;
            }

            if (clientId === "") {
                log("client id required");

                socket.close(ErrorCodes.INVALID_CLIENTID);
                return;
            }

            socket.on("error", (e) => {
                log("socket error", e);
            });

            socket.on("close", (e) => {
                log("socket closed", e);
            });

            socket.on("request", this.onMessage.bind(this, socket));

            socket._send = socket.send;
            socket.send = (msg) => {
                log("sending", msg);
                socket.write(encode(Types.FRAME, msg));
            };

            socket.clientId = clientId;

            this.connectionHandler(socket);
        });
    }

    onMessage(socket, msg) {
        log("message", msg);
        this.messageHandler(socket, msg);
    }
}

module.exports = {IPCServer};
