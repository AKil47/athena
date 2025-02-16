import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  navigate: async (path) => {
    return await ipcRenderer.invoke('navigate', path)
  },
  openExternalUrl: async (url) => {
    return await ipcRenderer.invoke('open-external-url', url)
  },
  onError: (callback) => {
    ipcRenderer.on('error', (event, message) => callback(message))
  }
})