
import { contextBridge, ipcRenderer } from 'electron';
import {getDisplayMediaSelector} from './capturer';

contextBridge.exposeInMainWorld("armcord", {
  window: {
    show: () => ipcRenderer.sendSync('win-show'),
    hide: () => ipcRenderer.sendSync('win-hide'),
    minimize: () => ipcRenderer.sendSync('win-minimize'),
    maximize: () => ipcRenderer.sendSync('win-maximize'),
  },
  electron: process.versions.electron,
  version: ipcRenderer.sendSync('get-app-version', 'app-version'),
  getDisplayMediaSelector: getDisplayMediaSelector,
  splashEnd: () => ipcRenderer.sendSync('splashEnd'),
  channel: ipcRenderer.sendSync('channel')
});