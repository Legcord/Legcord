# Security hardening: fix CSP, XSS holes and permission leaks

couple of security fixes i noticed while auditing the codebase:

**CSP was basically disabled** - [`src/discord/extensions/csp.ts`](https://github.com/Legcord/Legcord/blob/dev/src/discord/extensions/csp.ts) had the CSP set to `undefined` for mainFrame which defeats the purpose. now it enforces a proper policy - only allows scripts from discord/github domains, blocks inline eval from random sources, etc.

**XSS via window title** - in [`src/discord/window.ts`](https://github.com/Legcord/Legcord/blob/dev/src/discord/window.ts) the executeJavaScript was doing string concatenation with the page title. if discord somehow sent a malicious title it'd execute arbitrary code. switched to JSON.stringify to escape it properly. same fix in [`src/common/dom.ts`](https://github.com/Legcord/Legcord/blob/dev/src/common/dom.ts) for the navigate function.

**Mod loader downloading from anywhere** - [`src/discord/extensions/modloader.ts`](https://github.com/Legcord/Legcord/blob/dev/src/discord/extensions/modloader.ts) was fetching mods without checking if the URL is even valid. added checks to skip "DoNotChange" placeholder and verify URLs start with http(s).

**Permission handler incomplete** - [`src/main.ts`](https://github.com/Legcord/Legcord/blob/dev/src/main.ts) permission switch didn't have a default case, so unknown permissions weren't explicitly denied. now logs and denies anything not in the whitelist.

all fixes pass lint.
