
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
export async function sleep(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export function saveSettings(customTitlebarSetting: boolean, channelSetting: string, armcordCSPSetting: boolean, modsSetting: string) {
  console.log("Setting up ArmCord settings.");
    storage.set('settings', { customTitlebar: customTitlebarSetting, channel: channelSetting, firstRun: 'done', armcordCSP: armcordCSPSetting, mods: modsSetting }, function(error) {
      if (error) throw error;
    });
}
