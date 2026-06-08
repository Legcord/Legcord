import { desktopCapturer, ipcMain, type Streams, session } from "electron";
import { getConfig } from "../common/config.js";
import { mainWindows } from "./window.js";

export function registerCustomHandler(): void {
    session.defaultSession.setDisplayMediaRequestHandler(
        async (request, callback) => {
            console.log(request);
            let sources = await desktopCapturer
                .getSources({
                    types: ["window", "screen"],
                })
                .catch((err) => console.error(err));

            if (!sources) return callback({});
            if (process.platform === "linux" && process.env.XDG_SESSION_TYPE?.toLowerCase() === "wayland") {
                console.log("WebRTC Capturer detected, using native window picker.");
                if (sources[0] === undefined) return callback({});
            }

            mainWindows.every((window) => {
                window.webContents.send("getSources", sources);
            });

            const interval = setInterval(async () => {
                const updatedSources = await desktopCapturer
                    .getSources({
                        types: ["window", "screen"],
                    })
                    .catch((err) => console.error(err));

                if (updatedSources) {
                    sources = updatedSources as Electron.DesktopCapturerSource[];
                    mainWindows.every((window) => {
                        window.webContents.send("updateSources", updatedSources);
                    });
                }
            }, 1500);

            ipcMain.removeAllListeners("startScreenshare");
            ipcMain.once("startScreenshare", (_event, id: string, name: string, audio: boolean) => {
                clearInterval(interval);
                console.log(`ID: ${id}`);
                if (id === "none") {
                    try {
                        callback({});
                    } catch (_e) {}
                } else {
                    console.log(`Audio status: ${audio}`);
                    const result = { id, name };
                    console.log(result);
                    let options: Streams = { video: sources?.[0] as Electron.DesktopCapturerSource };
                    switch (process.platform) {
                        case "win32":
                        case "linux":
                        case "darwin":
                            options = { video: result };
                            if (audio)
                                options = {
                                    video: result,
                                    audio: getConfig("audio").loopbackType,
                                };
                            callback(options);
                            break;
                        default:
                            callback({ video: result });
                    }
                }
            });
        },
        { useSystemPicker: getConfig("useMacSystemPicker") },
    );
}
