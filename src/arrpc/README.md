 <div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/19228318/202900211-95e8474b-edbb-4048-ba0b-a581a6d57fc4.png" width=300>
    <img alt="arRPC" src="https://user-images.githubusercontent.com/19228318/203024061-064fc015-9096-40c3-9786-ad23d90414a6.png" width=300>
  </picture> <br>
  <a href="https://choosealicense.com/licenses/mit/l"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg"></a>
  <a href="https://github.com/sponsors/CanadaHonk"><img alt="GitHub Sponsors" src="https://img.shields.io/github/sponsors/CanadaHonk?label=Sponsors&logo=github"></a>
  <h3>An open implementation of Discord's local RPC servers</h3>
  <h4>Allowing RPC where it was otherwise impossible, like Discord Web and custom clients</h4>
</div>

<br>

arRPC is an open source implementation of Discord's half-documented local RPC servers for their desktop client. This open source implementation purely in NodeJS allows it to be used in many places where it is otherwise impossible to do: Discord web and alternative clients like ArmCord/etc. It opens a simple bridge WebSocket server which messages the JSON of exactly what to dispatch with in the client with no extra processing needed, allowing small and simple mods or plugins. **arRPC is experimental and a work in progress, so expect bugs, etc.**

<br>

Rich Presence (RPC) is the name for how some apps can talk to Discord desktop on your PC via localhost servers to display detailed info about the app's state. This usually works via parts of Discord desktop natively doing things + parts of Discord web interpreting that and setting it as your status. arRPC is an open source implementation of the local RPC servers on your PC, allowing apps to talk to it thinking it was just normal Discord. It can then send that info to apps which usually don't get RPC, like Discord Web, ArmCord, etc. which can then set that as your status. This would otherwise not be possible, as web apps/browsers/etc can't just use Discord's already existing code and version.

-   App with Discord RPC
-   ~~Discord Desktop's native server~~ arRPC
-   ~~Discord Web's setting~~ mod/plugin

<br>

## Usage

### Server (**REQUIRED**)

1. Have latest (>=18) Node installed
2. Clone GitHub repo
3. `npm install`
4. Run server with `node src`

### Web

#### No Mods

1. Get [the arRPC server running](#server-required)
2. With Discord open, run the content of [`examples/bridge_mod.js`](examples/bridge_mod.js) in Console (Ctrl+Shift+I).

#### Vencord

1. Get [the arRPC server running](#server-required)
2. Just enable the `WebRichPresence (arRPC)` Vencord plugin!

### Custom Clients

#### ArmCord

ArmCord has arRPC specially integrated, just enable the option in it's settings (server not required)!

#### Webcord

1. Get [the arRPC server running](#server-required)
2. Disable the `Use built-in Content Security Policy` option in Advanced settings: ![image](https://user-images.githubusercontent.com/19228318/202926723-93b772fc-f37d-47d4-81fd-b11c5d4051e8.png)
3. With Webcord open, run the content of [`examples/bridge_mod.js`](examples/bridge_mod.js) in the DevTools Console (Ctrl+Shift+I).

---

Then just use apps with Discord RPC like normal and they _should_ work!

<br>

## Supported

### Transports

-   [x] WebSocket Server
    -   [x] JSON
    -   [ ] Erlpack
-   [ ] HTTP Server
-   [x] IPC
-   [x] Process Scanning

### Commands

-   [x] DISPATCH
-   [x] SET_ACTIVITY
-   [x] INVITE_BROWSER
-   [x] GUILD_TEMPLATE_BROWSER
-   [x] DEEP_LINK
