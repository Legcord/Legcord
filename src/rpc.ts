import { parentPort } from "node:worker_threads";
// this file is executed in the utility process
// check window.ts for more details
// see more here https://www.electronjs.org/docs/latest/api/utility-process
import RPCServer, { type ServerSettings, type GameList } from "arrpc";

const detectables: GameList = process.env.detectables ? JSON.parse(process.env.detectables) : [];
const settings: ServerSettings = process.env.settings
    ? JSON.parse(process.env.settings)
    : { processScanning: true, windowsLegacyScanning: false, scanInterval: 5000 };

const RPC = await new RPCServer(detectables, settings);
// Guard parentPort
if (!parentPort) {
    console.error("rpc.ts must be run inside a Worker!");
    process.exit(1);
}

RPC.on("activity", (data: string) => {
    console.log(data);
    const response = { type: "activity", data };
    parentPort?.postMessage(JSON.stringify(response));
});

RPC.on("invite", (code: string) => {
    console.log(code);
    const response = { type: "invite", code };
    parentPort?.postMessage(JSON.stringify(response));
});

parentPort.once("message", async (e) => {
    if (e.message === "refreshProcessList") {
        const processes = await RPC.getProcessesList();
        console.log(processes);
        const response = { type: "processList", data: processes };
        parentPort?.postMessage(JSON.stringify(response));
    }
});
