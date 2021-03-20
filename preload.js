// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})
style = document.createElement("style");
document.head.appendChild(style);
style.appendChild(
  document.createTextNode(
    `@import url("https://smartfrigde.github.io/smartcord/custom.css")`
  )
);