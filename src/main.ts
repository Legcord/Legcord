// Modules to control application life and create native browser window
import { app, BrowserWindow, ipcMain, shell } from "electron";
import * as path from "path";
import * as storage from 'electron-json-storage';
import {setup} from './utils';
import './extensions/plugin';
var isSetup = null;
var contentPath:string = "null";
var frame:boolean;

storage.keys(function(error, keys) {
    if (error) throw error;
  
    for (var key of keys) {
      console.log('There is a key called: ' + key);
    }
  });
storage.has('firstRun', function(error, hasKey) {
  if (error) throw error;

  if (!hasKey) {
    console.log('First run of the ArmCord. Starting setup.');
    isSetup = true;
    setup();
    contentPath = __dirname + '/content/setup.html'
  } else {
    console.log('ArmCord has been run before. Skipping setup.');
    isSetup = false;
    contentPath = __dirname + '/content/index.html'
  }
});
storage.get('settings', function(error, data:any) {
    if (error) throw error;
    console.log(data);
    frame = data.customTitlebar;
    console.log(frame)
  });
function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 300,
    height: 300,
    title: "ArmCord",
    frame: frame,
    webPreferences: {
      preload: path.join(__dirname, 'preload/preload.js')
    }
  })
  ipcMain.on("get-app-path", (event, arg) => {
    event.reply("app-path", app.getAppPath());
  });
  ipcMain.on("open-external-link", (event, href: string) => {
    shell.openExternal(href);
  });
  ipcMain.on("win-maximize", (event, arg) => {
    mainWindow.maximize();
  });
  ipcMain.on("win-isMaximized", (event, arg) => {
    event.returnValue = mainWindow.isMaximized();
  });
  ipcMain.on("win-minimize", (event, arg) => {
    mainWindow.minimize();
  });
  ipcMain.on("win-show", (event, arg) => {
    mainWindow.show();
  });
  ipcMain.on("win-hide", (event, arg) => {
    mainWindow.hide();
  });
  ipcMain.on("get-app-version", (event) => {
    event.returnValue = process.env.npm_package_version;
  })
  ipcMain.on("splashEnd", (event, arg) => {
    mainWindow.setSize(800, 600);
  });
  ipcMain.on("channel", (event) => {
    event.returnValue = storage.getSync('channel');
  })
  mainWindow.loadFile(contentPath)
}


app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
