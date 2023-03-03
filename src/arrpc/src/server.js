const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, "arRPC")} > ${rgb(87, 242, 135, "bridge")}]`, ...args);
const {EventEmitter} = require("events");

const IPCServer = require("./transports/ipc.js");
const WSServer = require("./transports/websocket.js");
const ProcessServer = require("./process/index.js");

let socketId = 0;
class RPCServer extends EventEmitter {
    constructor() {
        super();
        return (async () => {
            this.onConnection = this.onConnection.bind(this);
            this.onMessage = this.onMessage.bind(this);
            this.onClose = this.onClose.bind(this);

            const handlers = {
                connection: this.onConnection,
                message: this.onMessage,
                close: this.onClose
            };

            this.ipc = await new IPCServer(handlers);
            this.ws = await new WSServer(handlers);
            this.process = await new ProcessServer(handlers);

            return this;
        })();
    }

    onConnection(socket) {
        socket.send({
            cmd: "DISPATCH",
            evt: "READY",

            data: {
                v: 1,

                // needed otherwise some stuff errors out parsing json strictly
                user: {
                    // mock user data using arRPC app/bot
                    id: "1045800378228281345",
                    username: "arRPC",
                    discriminator: "0000",
                    avatar: "cfefa4d9839fb4bdf030f91c2a13e95c",
                    flags: 0,
                    premium_type: 0
                },
                config: {
                    api_endpoint: "//discord.com/api",
                    cdn_host: "cdn.discordapp.com",
                    environment: "production"
                }
            }
        });

        socket.socketId = socketId++;

        this.emit("connection", socket);
    }

    onClose(socket) {
        this.emit("activity", {
            activity: null,
            pid: socket.lastPid,
            socketId: socket.socketId.toString()
        });

        this.emit("close", socket);
    }

    async onMessage(socket, {cmd, args, nonce}) {
        this.emit("message", {socket, cmd, args, nonce});

        switch (cmd) {
            case "SET_ACTIVITY":
                const {activity, pid} = args; // translate given parameters into what discord dispatch expects

                if (!activity)
                    return this.emit("activity", {
                        activity: null,
                        pid,
                        socketId: socket.socketId.toString()
                    });

                const {buttons, timestamps, instance} = activity;

                socket.lastPid = pid ?? socket.lastPid;

                const metadata = {};
                const extra = {};
                if (buttons) {
                    // map buttons into expected metadata
                    metadata.button_urls = buttons.map((x) => x.url);
                    extra.buttons = buttons.map((x) => x.label);
                }

                if (timestamps)
                    for (const x in timestamps) {
                        // translate s -> ms timestamps
                        if (Date.now().toString().length - timestamps[x].toString().length > 2)
                            timestamps[x] = Math.floor(1000 * timestamps[x]);
                    }

                this.emit("activity", {
                    activity: {
                        application_id: socket.clientId,
                        type: 0,
                        metadata,
                        flags: instance ? 1 << 0 : 0,
                        ...activity,
                        ...extra
                    },
                    pid,
                    socketId: socket.socketId.toString()
                });

                socket.send?.({
                    cmd,
                    data: null,
                    evt: null,
                    nonce
                });

                break;

            case "GUILD_TEMPLATE_BROWSER":
            case "INVITE_BROWSER":
                const {code} = args;
                socket.send({
                    cmd,
                    data: {
                        code
                    },
                    nonce
                });

                this.emit(cmd === "INVITE_BROWSER" ? "invite" : "guild-template", code);
                break;

            case "DEEP_LINK":
                this.emit("link", args.params);
                break;
        }
    }
}
module.exports = RPCServer;
