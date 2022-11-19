var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : {default: mod};
    };
const server = require("./server.js");
global.fetch = __importDefault(require("node-fetch"));
async function start() {
    const x = await new server.RPCServer();
}
start();
