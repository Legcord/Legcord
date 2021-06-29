const inject = async () => {
  console.log('[GooseMod for Web] Injecting...');

  // Re-define localStorage as Discord removes it
  function getLocalStoragePropertyDescriptor() {
    const frame = document.createElement('frame');
    frame.src = 'about:blank';
  
    document.body.appendChild(frame);
  
    let r = Object.getOwnPropertyDescriptor(frame.contentWindow, 'localStorage');
  
    frame.remove();
  
    return r;
  }
  
  Object.defineProperty(window, 'localStorage', getLocalStoragePropertyDescriptor());
  
  console.log('[GooseMod for Web] Redefined localStorage');

  const branchURLs = {
    'release': 'https://api.goosemod.com/inject.js',
    'dev': 'https://updates.goosemod.com/guapi/goosemod/dev'
  };
  
  const branch = localStorage.getItem('goosemodUntetheredBranch') || 'release';

  console.log('[GooseMod for ArmCord] Branch =', branch);
  console.log('[GooseMod for ArmCord] JS Url =', branchURLs[branch]);
  
  const js = await (await fetch(branchURLs[branch])).text(); // JSON.parse(localStorage.getItem('goosemodCoreJSCache'));

  const el = document.createElement('script');
  
  el.appendChild(document.createTextNode(js));
  
  document.body.appendChild(el);

  console.log('[GooseMod for ArmCord] Injected fetched JS');
};

// Delay actual injection to fix FF issues

let el = document.createElement('script');

el.appendChild(document.createTextNode(`(${inject.toString()})()`));

document.body.appendChild(el);