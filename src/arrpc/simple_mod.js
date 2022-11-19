const dispatch = (() => {
    let Dispatcher;

    return function (event) {
        Dispatcher ??= window.Vencord?.Webpack.Common.FluxDispatcher;
        if (!Dispatcher) {
            const cache = webpackChunkdiscord_app.push([[Symbol()], {}, (w) => w]).c;
            webpackChunkdiscord_app.pop();

            outer: for (const id in cache) {
                const mod = cache[id].exports;
                for (const exp in mod) {
                    if (mod[exp]?.isDispatching) {
                        Dispatcher = mod[exp];
                        break outer;
                    }
                }
            }
        }
        if (!Dispatcher) return; // failed to find, your choice if and how u wanna handle this

        return Dispatcher.dispatch(event);
    };
})();
const ws = new WebSocket("ws://localhost:1337"); // connect to arRPC bridge
ws.onmessage = (x) => {
    msg = JSON.parse(x.data);
    console.log(msg);

    dispatch({type: "LOCAL_ACTIVITY_UPDATE", ...msg}); // set RPC status
};
