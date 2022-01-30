import { app, Menu, Tray } from 'electron';
import {mainWindow} from './window';
import * as path from 'path'
let tray = null
app.whenReady().then(() => {
  tray = new Tray(path.join(__dirname, "../", "/assets/ac_plug.png"))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open ArmCord",
      click: function () {
        mainWindow.show();
      },
    },
    {
      label: "Support Discord Server",
      click: function () {
        mainWindow.show();
        mainWindow.loadURL("https://discord.gg/F25bc4RYDt");
      },
    },
    {
      label: "Quit ArmCord",
      click: function () {
        app.quit();
      },
    },
  ]);
  
  tray.setToolTip('ArmCord ' + process.env.npm_package_version)
  tray.setContextMenu(contextMenu)
})