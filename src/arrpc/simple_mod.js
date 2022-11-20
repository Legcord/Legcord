let Dispatcher;

const ws = new WebSocket("ws://127.0.0.1:1337"); // connect to arRPC bridge
ws.onmessage = (x) => {
    msg = JSON.parse(x.data);
    console.log(msg);

    if (!Dispatcher) {
        const cache = window.webpackChunkdiscord_app.push([[Symbol()], {}, (x) => x]).c;
        window.webpackChunkdiscord_app.pop();

        for (const id in cache) {
            let mod = cache[id].exports;
            mod = mod && (mod.Z ?? mod.ZP);

            if (mod && mod.register && mod.wait) {
                Dispatcher = mod;
                break;
            }
        }
    }

    Dispatcher.dispatch({type: "LOCAL_ACTIVITY_UPDATE", ...msg}); // set RPC status
};
