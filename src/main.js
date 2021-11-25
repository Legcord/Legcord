// Modules to control application life and create native browser window
const { app, BrowserWindow, session, Tray, Menu } = require("electron");
const path = require("path");
const contextMenu = require("electron-context-menu");
const os = require("os");
const bundle = require("./bundle.json");

require("v8-compile-cache");
require("./utils/updater.js.js");

//Defaults
let frame = true;
let iconformat = "../assets/ac_icon_transparent.png";

if (!require("./utils/armcord.js").Titlebar === "native") frame = false;
if (!os.type() == 'Linux') iconformat = "../assets/ac_plug.ico";

contextMenu({
  prepend: (defaultActions, parameters, browserWindow) => [
    {
      label: "Image",
      // Only show it when right-clicking images
      visible: parameters.mediaType === "image",
    },
  ],
});

contextMenu.showSearchWithGoogle = false;

let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: iconformat,
    title: "ArmCord",
    frame: frame,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      enableRemoteModule: true,
      nodeIntegration: false,
    },
  });

  const appIcon = new Tray(iconformat);
  mainWindow.webContents.userAgent = "Mozilla/5.0 (X12; Linux x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36"; //fake useragent
  mainWindow.loadFile("./client/index.html");
  mainWindow.focus();

  mainWindow.webContents.on("new-window", function (e, url) {
    e.preventDefault();
    require("electron").shell.openExternal(url);
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  var contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: function () {
        mainWindow.show();
      },
    },
    {
      label: "Support Discord Server",
      click: function () {
        mainWindow.show();
        mainWindow.loadURL(bundle.supportServer);
      },
    },
    {
      label: "Quit",
      click: function () {
        mainWindow.destroy();
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  appIcon.on("click", () => {
    mainWindow.show()
  });

  appIcon.setContextMenu(contextMenu);

  // Emitted when the window is closed.
  mainWindow.on("close", function (event) {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on("show", function () {
    //temporary fix
    try {
      appIcon();
    } catch (error) {
      //console.error(error);
      // expected output: TypeError: appIcon is not a function
    }
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  require("./utils/mod.js");
  require("./utils/plugin.js");

  session
    .fromPartition("some-partition")
    .setPermissionRequestHandler((webContents, permission, callback) => {
      const url = webContents.getURL(); //unused?

      if (["notifications", "microphone"].includes(permission)) {
        // Approves the permissions request
        callback(true);
      };

      if (!url.startsWith("discord://")) {
        // Denies the permissions request
        return callback(false);
      }
    });

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
