# arRPC

arRPC is an open source implementation of Discord's half-documented local RPC servers for their desktop client. This open source implementation purely in NodeJS allows it to be used in many places where it is otherwise impossible to do: Discord web and alternative clients like Armcord/etc. It opens a simple bridge WebSocket server which messages the JSON of exactly what to dispatch with in the client with no extra processing needed, allowing small and simple mods or plugins. **It is currently in alpha and is very WIP, expect bugs, etc.**

### How to try

1. Clone repo
2. Run server with `node src` (use new Node)
3. Open Discord in browser with CSP disabled (using an extension)
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
-   [ ] AUTHORIZE
-   [ ] AUTHENTICATE
-   [ ] GET_GUILD
-   [ ] GET_GUILDS
-   [ ] GET_CHANNEL
-   [ ] GET_CHANNELS
-   [ ] SUBSCRIBE
-   [ ] UNSUBSCRIBE
-   [ ] SET_USER_VOICE_SETTINGS
-   [ ] SELECT_VOICE_CHANNEL
-   [ ] GET_SELECTED_VOICE_CHANNEL
-   [ ] SELECT_TEXT_CHANNEL
-   [ ] GET_VOICE_SETTINGS
-   [ ] SET_VOICE_SETTINGS
-   [ ] SET_CERTIFIED_DEVICES
-   [x] SET_ACTIVITY
-   [ ] SEND_ACTIVITY_JOIN_INVITE
-   [ ] CLOSE_ACTIVITY_REQUEST
