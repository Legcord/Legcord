import RPCServer, { type GameList } from "arrpc";
import { parentPort } from "worker_threads";

const detectables: GameList = process.env.detectables
  ? JSON.parse(process.env.detectables)
  : [];

const RPC = new RPCServer(detectables);

// Guard parentPort
if (!parentPort) {
  console.error("rpc.ts must be run inside a Worker!");
  process.exit(1);
}

RPC.on("activity", (data: string) => {
  console.log(data);
  const response = { type: "activity", data };
  parentPort.postMessage(JSON.stringify(response));
});

RPC.on("invite", (code: string) => {
  console.log(code);
  const response = { type: "invite", code };
  parentPort.postMessage(JSON.stringify(response));
});

parentPort.once("message", async (e) => {
  if (e.data.message === "refreshProcessList") {
    const processes = await RPC.getProcessesList();
    console.log(processes);
    const response = { type: "processList", data: processes };
    parentPort.postMessage(JSON.stringify(response));
  }
});
