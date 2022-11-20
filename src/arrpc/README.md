# arRPC

arRPC is an open source implementation of Discord's half-documented local RPC servers for their desktop client. This open source implementation purely in NodeJS allows it to be used in many places where it is otherwise impossible to do: Discord web and alternative clients like Armcord/etc. It opens a simple bridge WebSocket server which messages the JSON of exactly what to dispatch with in the client with no extra processing needed, allowing small and simple mods or plugins. **It is currently in alpha and is very WIP, expect bugs, etc.**

<br>

Rich Presence (RPC) is the name for how some apps can talk to Discord desktop on your PC via localhost servers to display detailed info about the app's state. This usually works via parts of Discord desktop natively doing things + parts of Discord web interpreting that and setting it as your status. arRPC is an open source implementation of the local RPC servers on your PC, allowing apps to talk to it thinking it was just normal Discord. It can then send that info to apps which usually don't get RPC, like Discord Web, Armcord, etc. which can then set that as your status. This would otherwise not be possible, as web apps/browsers/etc can't just use Discord's already existing code and version.

-   App with Discord RPC
-   ~~Discord Desktop's native server~~ arRPC
-   ~~Discord Web's setting~~ mod/plugin

<br>

### How to try

1. Clone repo
2. Run server with `node src` (use new Node)
3. Open Discord in browser
4. Run content of [`simple_mod.js`](simple_mod.js) in console
5. Use an app/thing with RPC
6. Hope it works, if not report bugs :)

## Supported

### Transports

-   [x] WebSocket Server
    -   [x] JSON
    -   [ ] Erlpack
-   [ ] HTTP Server
-   [x] IPC

### Commands

-   [x] DISPATCH
-   [x] SET_ACTIVITY
-   [x] INVITE_BROWSER
