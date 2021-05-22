chrome.webRequest.onHeadersReceived.addListener((h) => {
	h.responseHeaders.forEach((e, i) => {
		if (e.name.toLowerCase() === 'content-security-policy') {
			e.value = ''
		}
	})
	return {responseHeaders: h.responseHeaders}
}, {urls: ["*://*.discord.com/*"]},
['blocking', 'responseHeaders']
)

const corsAllowUrls = [
      'https://github.com/GooseMod/GooseMod/releases/download/dev/index.js',
      'https://github-releases.githubusercontent.com/'
    ];

if (corsAllowUrls.some((x) => url.startsWith(x))) {
        responseHeaders['access-control-allow-origin'] = ['*'];
      }
//psst stolen from https://raw.githubusercontent.com/Goose-Nest/GooseUpdate/main/branches/goosemod/patch.js
//dont tell anyone :troll:
