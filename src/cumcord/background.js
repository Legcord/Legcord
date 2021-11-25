const cspAllowAll = [
    'connect-src',
    'style-src',
    'img-src',
    'font-src'
  ];
  const corsAllowUrls = [
    'https://github.com/GooseMod/GooseMod/releases/download/dev/index.js',
    'https://github-releases.githubusercontent.com/',
    'https://api.goosemod.com/inject.js',
    'https://raw.githubusercontent.com/Cumcord/Cumcord/stable/dist/build.js'
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
    if (corsAllowUrls.some((x) => url.startsWith(x))) {
      let cors = responseHeaders.find((x) => x.name === 'access-control-allow-origin');
      cors.value = '*';
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