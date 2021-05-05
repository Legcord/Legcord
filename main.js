// Modules to control application life and create native browser window
const { app, BrowserWindow, session, Tray, Menu } = require("electron");
const path = require("path");
const contextMenu = require("electron-context-menu");
require("v8-compile-cache");
require("./utils/updater");

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
    icon: __dirname + "/discord.ico",
    title: "ArmCord",
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      enableRemoteModule: true,
      nodeIntegration: false,
    },
  });

  var appIcon = new Tray(__dirname + "/discord.ico");
  mainWindow.webContents.userAgent =
    "Mozilla/5.0 (X12; FreeBSD x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36"; //fake useragent
  mainWindow.loadFile("index.html");
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
        mainWindow.loadURL("https://discord.gg/F25bc4RYDt");
      },
    },
    {
      label: "Quit",
      click: function () {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

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
      console.error(error);
      // expected output: TypeError: appIcon is not a function
    }
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  session.defaultSession.loadExtension(
    `${require("electron").app.getAppPath()}/goosemod/`
  );
  session
    .fromPartition("some-partition")
    .setPermissionRequestHandler((webContents, permission, callback) => {
      const url = webContents.getURL(); //unused?

      if (permission === "notifications") {
        // Approves the permissions request
        callback(true);
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
