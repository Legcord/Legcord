const cspAllowAll = [
  'connect-src',
  'style-src',
  'img-src',
  'font-src'
];

chrome.webRequest.onHeadersReceived.addListener(({ responseHeaders, url }) => {
  let csp = responseHeaders.find((x) => x.name === 'content-security-policy');

  if (csp) {
    for (let p of cspAllowAll) {
      csp.value = csp.value.replace(`${p}`, `${p} * blob: data:`); // * does not include data: URIs
    }

    // Fix Discord's broken CSP which disallows unsafe-inline due to having a nonce (which they don't even use?)
    csp.value = csp.value.replace(/'nonce-.*?' /, '');
  }

	return {
    responseHeaders
  };
},

  {
    urls: [
      '*://*.discord.com/*'
    ]
  },

  ['blocking', 'responseHeaders']
);
