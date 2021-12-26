import { contextBridge, ipcRenderer } from 'electron';
import {getDisplayMediaSelector} from './capturer';

console.log(ipcRenderer.send('channel'))

contextBridge.exposeInMainWorld("armcord", {
  window: {
    show: () => ipcRenderer.send('win-show'),
    hide: () => ipcRenderer.send('win-hide'),
    minimize: () => ipcRenderer.send('win-minimize'),
    maximize: () => ipcRenderer.send('win-maximize'),
  },
  electron: process.versions.electron,
  version: ipcRenderer.send('get-app-version', 'app-version'),
  getDisplayMediaSelector: getDisplayMediaSelector,
  saveSettings: (...args: any) => ipcRenderer.send('saveSettings', ...args),
  splashEnd: () => ipcRenderer.send('splashEnd'),
  channel: ipcRenderer.send('channel')
});
contextBridge.exposeInMainWorld("electron", {}) //deprecated, used for legacy purposes, will be removed in future versions