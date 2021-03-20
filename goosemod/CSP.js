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
