import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  BrowserWindow,
  type BrowserWindowConstructorOptions,
  type MessageBoxOptions,
  app,
  dialog,
  nativeImage,
  shell,
} from "electron";
import contextMenu from "electron-context-menu";
import { firstRun, getConfig, setConfig } from "../common/config.js";
import { navigateTo } from "../common/dom.js";
import { forceQuit, setForceQuit } from "../common/forceQuit.js";
import { initQuickCss, injectThemesMain } from "../common/themes.js";
import { getWindowState, setWindowState } from "../common/windowState.js";
import { init } from "../main.js";
import { registerGlobalKeybinds } from "./globalKeybinds.js";
import { registerIpc } from "./ipc.js";
import { setMenu } from "./menu.js";
import { startRPC, stopRPC } from "./rpcProcess.js";
import { registerCustomHandler } from "./screenshare.js";
import { mainTouchBar } from "./touchbar.js";
import { createTray, tray } from "./tray.js";
import { registerVenmicIpc } from "./venmic.js";

export let mainWindows: BrowserWindow[] = [];
export let inviteWindow: BrowserWindow;

contextMenu({
  showSaveImageAs: true,
  showCopyImageAddress: true,
  showSearchWithGoogle: false,
  prepend: (_defaultActions, parameters) => [
    {
      label: "Search with Google",
      visible: parameters.selectionText.trim().length > 0,
      click: () => {
        void shell.openExternal(
          `https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}`,
        );
      },
    },
    {
      label: "Search with DuckDuckGo",
      visible: parameters.selectionText.trim().length > 0,
      click: () => {
        void shell.openExternal(
          `https://duckduckgo.com/?q=${encodeURIComponent(parameters.selectionText)}`,
        );
      },
    },
  ],
});

function doAfterDefiningTheWindow(passedWindow: BrowserWindow): void {
  createTray();
  if (getWindowState("isMaximized") ?? false) {
    passedWindow.setSize(835, 600);
    passedWindow.maximize();
    void passedWindow.webContents.executeJavaScript(
      'document.body.setAttribute("isMaximized", "");',
    );
    passedWindow.hide();
  }

  const ignoreProtocolWarning = getConfig("ignoreProtocolWarning");
  registerIpc(passedWindow);
  registerVenmicIpc();

  if (getConfig("mobileMode")) {
    passedWindow.webContents.userAgent =
      "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.149 Mobile Safari/537.36";
  } else {
    let osType =
      process.platform === "darwin"
        ? "Macintosh"
        : process.platform === "win32"
          ? "Windows"
          : "Linux";
    if (osType === "Linux") osType = `X11; ${osType}`;
    const chromeVersion = process.versions.chrome;
    const userAgent = `Mozilla/5.0 (${osType} ${os.arch()}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
    passedWindow.webContents.userAgent = userAgent;
  }

  if (mainWindows.length === 1) {
    app.on(
      "second-instance",
      (_event, commandLine, _workingDirectory, additionalData) => {
        void (async () => {
          console.log(additionalData);
          if (!getConfig("multiInstance")) {
            if (passedWindow) {
              if (passedWindow.isMinimized()) passedWindow.restore();
              passedWindow.show();
              passedWindow.focus();
            }
            if (commandLine && commandLine.length > 0) {
              const lastArg = commandLine.pop();
              if (lastArg?.startsWith("discord://-")) {
                navigateTo(passedWindow, lastArg.replace("discord://-", ""));
              }
            }
          } else {
            await init();
          }
        })();
      },
    );
  }

  app.on("activate", async () => {
    app.show();
  });

  passedWindow.webContents.on("frame-created", (_, { frame }) => {
    if (!frame) return;
    frame.once("dom-ready", async () => {
      const isYoutube =
        frame.url.includes("youtube.com/embed/") ||
        frame.url.includes("youtube-nocookie.com/embed/") ||
        (frame.url.includes("discordsays") && frame.url.includes("youtube.com"));

      if (isYoutube) {
        try {
          await frame.executeJavaScript(
            readFileSync(
              path.join(import.meta.dirname, "assets/app/js/adguard.js"),
              "utf-8",
            ),
          );
        } catch (e) {
          console.warn("adguard.js injection skipped:", e);
        }
      }
    });
  });

  passedWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url === "about:blank") return { action: "allow" };
    if (url.startsWith("blob:https://discord.com/")) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: { show: false },
      };
    }
    if (
      url === "https://discord.com/popout" ||
      url === "https://canary.discord.com/popout" ||
      url === "https://ptb.discord.com/popout"
    ) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          alwaysOnTop: getConfig("popoutPiP"),
        },
      };
    }
    if (
      url.startsWith("https:") ||
      url.startsWith("http:") ||
      url.startsWith("mailto:")
    ) {
      void shell.openExternal(url);
    } else if (ignoreProtocolWarning) {
      void shell.openExternal(url);
    } else {
      const options: MessageBoxOptions = {
        type: "question",
        buttons: ["Yes, please", "No, I don't"],
        defaultId: 1,
        title: url,
        message: `Do you want to open ${url}?`,
        detail: "This url was detected to not use normal browser protocols.",
        checkboxLabel: "Remember my answer",
        checkboxChecked: false,
      };

      void dialog
        .showMessageBox(passedWindow, options)
        .then(({ response, checkboxChecked }) => {
          if (checkboxChecked) {
            setConfig("ignoreProtocolWarning", response === 0);
          }
          if (response === 0) {
            void shell.openExternal(url);
          }
        });
    }
    return { action: "deny" };
  });

  passedWindow.webContents.session.setSpellCheckerLanguages(
    getConfig("spellcheckLanguage"),
  );

  registerCustomHandler();

  const blockedPatterns = [
    /https:\/\/.*\/api\/v\d+\/science/,
    /https:\/\/sentry\.io\/.*/,
    /https:\/\/.*\.nel\.cloudflare\.com\/.*/,
  ];
  passedWindow.webContents.session.webRequest.onBeforeRequest(
    (details, callback) => {
      if (blockedPatterns.some((pattern) => pattern.test(details.url))) {
        return callback({ cancel: true });
      }
      return callback({});
    },
  );

  passedWindow.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ["https://www.youtube.com/embed/*"] },
    ({ requestHeaders }, callback) => {
      requestHeaders.Referer = "https://google.com";
      callback({ requestHeaders });
    },
  );

  if (getConfig("tray") === "dynamic") {
    passedWindow.webContents.on("page-favicon-updated", (_, favicons) => {
      try {
        let favicon = nativeImage.createFromDataURL(favicons[0]);
        if (process.platform === "darwin") {
          favicon = favicon.resize({ height: 22 });
        } else if (process.platform === "win32") {
          favicon = favicon.resize({ height: 32 });
        }
        tray.setImage(favicon);
      } catch {
        return;
      }
    });
  }

  initQuickCss(passedWindow);
  passedWindow.setTouchBar(mainTouchBar);

  app.on("open-url", (_event, url) => {
    navigateTo(passedWindow, url.replace("discord://-", ""));
  });

  passedWindow.webContents.on("page-title-updated", (e, title) => {
    const legcordSuffix = " - Legcord";
    if (process.platform === "win32") {
      if (title.startsWith("•")) {
        passedWindow.setOverlayIcon(
          nativeImage.createFromPath(
            path.join(import.meta.dirname, "../", "/assets/badge-11.ico"),
          ),
          "You have some unread messages.",
        );
      } else if (title.startsWith("(")) {
        const pingsMatch = /\((\d+)\)/.exec(title);
        const pings = pingsMatch ? Number.parseInt(pingsMatch[1]) : 0;
        passedWindow.setOverlayIcon(
          nativeImage.createFromPath(
            path.join(
              import.meta.dirname,
              "../",
              `/assets/badge-${pings > 9 ? 10 : pings}.ico`,
            ),
          ),
          "You have some unread messages.",
        );
      } else {
        passedWindow.setOverlayIcon(null, "");
      }
    }
    if (process.platform === "darwin") {
      if (title.startsWith("•")) app.dock?.setBadge("•");
      else if (title.startsWith("(")) {
        if (getConfig("bounceOnPing")) app.dock?.bounce();
        const pingsMatch = /\((\d+)\)/.exec(title);
        app.setBadgeCount(pingsMatch ? Number.parseInt(pingsMatch[1]) : 0);
      } else {
        app.setBadgeCount(0);
      }
    }
    if (!title.endsWith(legcordSuffix)) {
      e.preventDefault();
      void passedWindow.webContents.executeJavaScript(
        `document.title = '${title.replace("Discord |", "") + legcordSuffix}'`,
      );
    }
  });

  injectThemesMain(passedWindow);
  passedWindow.on("unresponsive", () => {
    passedWindow.webContents.reload();
  });

  setMenu();
  passedWindow.on("close", (e) => {
    if (mainWindows.length > 1) {
      mainWindows = mainWindows.filter((w) => w.id !== passedWindow.id);
      passedWindow.destroy();
    }
    if (getConfig("minimizeToTray") && !forceQuit) {
      e.preventDefault();
      passedWindow.hide();
    } else if (!getConfig("minimizeToTray")) {
      app.quit();
    }
  });

  app.on("before-quit", () => {
    const [width, height] = passedWindow.getSize();
    setWindowState({
      width,
      height,
      isMaximized: passedWindow.isMaximized(),
      x: passedWindow.getPosition()[0],
      y: passedWindow.getPosition()[1],
    });
    setForceQuit(true);
  });

  passedWindow.on("focus", () => {
    void passedWindow.webContents.executeJavaScript(
      'document.body.removeAttribute("unFocused");',
    );
  });
  passedWindow.on("blur", () => {
    void passedWindow.webContents.executeJavaScript(
      'document.body.setAttribute("unFocused", "");',
    );
  });

  passedWindow.on("maximize", () => {
    void passedWindow.webContents.executeJavaScript(
      'document.body.setAttribute("isMaximized", "");',
    );
  });
  passedWindow.on("unmaximize", () => {
    void passedWindow.webContents.executeJavaScript(
      'document.body.removeAttribute("isMaximized");',
    );
  });

  if (getConfig("inviteWebsocket") && mainWindows.length === 1) {
    startRPC(passedWindow);
  }
  if (firstRun) {
    passedWindow.close();
  }

  registerGlobalKeybinds();
  const channel = getConfig("channel");
  const baseUrl =
    channel === "canary"
      ? "https://canary.discord.com/app"
      : channel === "ptb"
        ? "https://ptb.discord.com/app"
        : "https://discord.com/app";
  void passedWindow.loadURL(baseUrl);

  if (getConfig("skipSplash")) {
    passedWindow.show();
  }
}

export function createWindow() {
  const browserWindowOptions: BrowserWindowConstructorOptions = {
    width: getWindowState("width") ?? 835,
    height: getWindowState("height") ?? 600,
    x: getWindowState("x"),
    y: getWindowState("y"),
    title: "Legcord",
    show: false,
    darkTheme: true,
    icon:
      getConfig("customIcon") ??
      path.join(import.meta.dirname, "../", "/assets/desktop.png"),
    frame: false,
    backgroundColor: "#202225",
    autoHideMenuBar: getConfig("autoHideMenuBar"),
    webPreferences: {
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: getConfig("sleepInBackground"),
      preload: path.join(import.meta.dirname, "discord/preload.mjs"),
      spellcheck: getConfig("spellcheck"),
    },
  };

  const style = getConfig("windowStyle");
  if (style === "native") browserWindowOptions.frame = true;
  else if (style === "overlay") {
    browserWindowOptions.titleBarStyle = "hidden";
    browserWindowOptions.titleBarOverlay = {
      color: getConfig("overlayButtonColor"),
      symbolColor: "#99aab5",
      height: 36,
    };
  }

  const transparency = getConfig("transparency");
  if (transparency === "universal") {
    browserWindowOptions.backgroundColor = "#00000000";
    browserWindowOptions.transparent = true;
  } else if (transparency === "modern") {
    browserWindowOptions.backgroundColor = "#00000000";
    if (os.platform() === "win32") {
      browserWindowOptions.transparent = false;
      browserWindowOptions.frame = true;
      browserWindowOptions.backgroundMaterial = "acrylic";
    } else if (os.platform() === "darwin") {
      browserWindowOptions.vibrancy = "fullscreen-ui";
      browserWindowOptions.transparent = true;
    }
  }

  const mainWindow = new BrowserWindow(browserWindowOptions);
  mainWindows.push(mainWindow);
  doAfterDefiningTheWindow(mainWindow);
}

export function createInviteWindow(code: string): void {
  inviteWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: "Legcord Invite Manager",
    darkTheme: true,
    icon:
      getConfig("customIcon") ??
      path.join(import.meta.dirname, "../", "/assets/desktop.png"),
    frame: true,
    autoHideMenuBar: getConfig("autoHideMenuBar"),
    webPreferences: {
      sandbox: false,
      spellcheck: getConfig("spellcheck"),
    },
  });
  inviteWindow.webContents.session.webRequest.onBeforeRequest(
    (details, callback) => {
      if (details.url.includes("ws://")) return callback({ cancel: true });
      return callback({});
    },
  );
  void inviteWindow.loadURL(`https://discord.com/invite/${code}`);
  inviteWindow.webContents.once("did-finish-load", () => {
    if (mainWindows[0] && !mainWindows[0].webContents.isLoading()) {
      inviteWindow.show();
      inviteWindow.webContents.once("will-navigate", () => inviteWindow.close());
    }
  });
}
