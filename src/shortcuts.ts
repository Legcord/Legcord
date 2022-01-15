
import { Menu, MenuItem } from "electron";
import { mainWindow } from "./main";
const menu = new Menu();
menu.append(
  new MenuItem({
    label: "ArmCord" + process.env.npm_package_version,
    submenu: [
      {
        role: "toggleDevTools",
        accelerator:
          process.platform === "darwin" ? "Ctrl+Cmd+I" : "Ctrl+Shift+I",
        click: () => {
          mainWindow.webContents.toggleDevTools();
        },
      },
      {
        role: "toggleDevTools",
        accelerator: "F12",
        click: () => {
          mainWindow.webContents.toggleDevTools();
        },
      },
      {
        role: "reload",
        accelerator:
          "Ctrl+F5",
        click: () => {
          mainWindow.webContents.reload();
        },
      },
    ],
  })
);
Menu.setApplicationMenu(menu);