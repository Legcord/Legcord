const load = async () => {
	console.log("[CCExt] Loading Cumcord...");
	const response = await fetch("https://raw.githubusercontent.com/Cumcord/Cumcord/stable/dist/build.js");
	const text = await response.text()
	eval(text);
}
const el = document.createElement('script');
el.appendChild(document.createTextNode(`(${load.toString()})();`));
document.body.appendChild(el);
