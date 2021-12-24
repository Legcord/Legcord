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
      storage.set('settings', { customTitlebar: true, channel: 'stable', firstRun: 'done' }, function(error) {
        if (error) throw error;
      });
}
export interface settingsStructure {
    channel: string,
    customTitlebar: boolean,
    firstRun: string,
}