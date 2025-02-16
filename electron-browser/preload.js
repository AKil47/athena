const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  navigate: (path) => ipcRenderer.send('navigate', path)
})