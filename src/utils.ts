/*--------------------------------------------------------------------------------------------------------
 *  This file has parts of one or more project files (VS Code) from Microsoft
 *  You can check your respective license and the original file in https://github.com/Microsoft/vscode/
 *-------------------------------------------------------------------------------------------------------*/
import * as storage from 'electron-json-storage';
//utillity functions that are used all over the codebase or just too obscure to be put in the file used in
export function addStyle(styleString: string) {
 const style = document.createElement('style');
 style.textContent = styleString;
 document.head.append(style);
};

export function addScript(scriptString: string) {
  var script = document.createElement("script");
  script.textContent = scriptString;
  document.body.append(script);
};
export function setup(){
    console.log("Setting up ArmCord settings.");
      storage.set('settings', { customTitlebar: true, channel: 'stable', firstRun: 'done', armcordCSP: true }, function(error) {
        if (error) throw error;
      });
}
export function append<T extends Node>(parent: HTMLElement, ...children: T[]): T {
	children.forEach(child => parent.appendChild(child));
	return children[children.length - 1];
}
export async function sleep(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}