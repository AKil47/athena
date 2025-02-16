const { contextBridge, ipcRenderer } = require('electron')

console.log('Preload script starting...')

const electronHandler = {
  navigateToUrl: (url) => ipcRenderer.invoke('navigateToUrl', url),
  resizeBrowserView: (bounds) => ipcRenderer.invoke('resizeBrowserView', bounds)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronHandler)
    console.log('Electron API exposed successfully')
  } catch (error) {
    console.error('Failed to expose Electron API:', error)
  }
} else {
  window.electron = electronHandler
}