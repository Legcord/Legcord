# arRPC Changelog

## v3.0.0 [26-11-2022]

-   **Added Process Scanning.** Now scans for detectable/verified games and tells Discord the app, allowing process detection whilst maintaining privacy (Discord does not see any/all processes, just the name and app ID).
-   **Fixed RPC not fully working with more apps/libraries.** Now responds with a mock/fake arRPC user and the proper config, replies with confirmation, and supports blank activites fully.
-   **Fixed a few minor Bridge bugs.** Fixed catchup not working with several apps.

## v2.2.1 [24-11-2022]

-   IPC: Fix version given as string not being accepted
-   IPC: Fix socket closing

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
