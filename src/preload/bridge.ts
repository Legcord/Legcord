
import { contextBridge, ipcRenderer } from 'electron';
import {getDisplayMediaSelector} from './capturer';

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
  splashEnd: () => ipcRenderer.send('splashEnd'),
  channel: ipcRenderer.send('channel')
});