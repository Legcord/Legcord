# arRPC Changelog

## v2.2.0 [20-11-2022]

-   Server: Move all looking up/fetching to client

## v2.1.0 [20-11-2022]

-   Server: Stop activites when app disconnects
-   Server: Added support for several apps shown at once (added `socketId`)
-   Bridge: Catchup newly connected clients with last message by socket id
-   Transports: Rewrote internal API to use handlers object
-   API: Added parsing for GUILD_TEMPLATE_BROWSER
-   API: Added parsing for DEEP_LINK

## v2.0.0 [20-11-2022]

-   feat (breaking): moved asset lookup to client
-   feat: add examples
-   feat: add changelog
