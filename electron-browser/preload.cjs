// preload.cjs
const { contextBridge, ipcRenderer } = require('electron')

console.log('Preload script starting...')

// Setup title update listener
let titleUpdateCallback = null

ipcRenderer.on('page-title-updated', (_, data) => {
  if (titleUpdateCallback) {
    titleUpdateCallback(data)
  }
})

contextBridge.exposeInMainWorld('electron', {
  navigateToUrl: async (url) => {
    try {
      return await ipcRenderer.invoke('navigateToUrl', url)
    } catch (error) {
      console.error('Navigation error:', error)
      return { success: false, error: error.message }
    }
  },
  resizeBrowserView: async (bounds) => {
    try {
      return await ipcRenderer.invoke('resizeBrowserView', bounds)
    } catch (error) {
      console.error('Resize error:', error)
      return { success: false, error: error.message }
    }
  },
  createTab: async (tabId) => {
    try {
      return await ipcRenderer.invoke('createTab', tabId)
    } catch (error) {
      console.error('Create tab error:', error)
      return { success: false, error: error.message }
    }
  },
  switchTab: async (tabId) => {
    try {
      return await ipcRenderer.invoke('switchTab', tabId)
    } catch (error) {
      console.error('Switch tab error:', error)
      return { success: false, error: error.message }
    }
  },
  closeTab: async (tabId) => {
    try {
      return await ipcRenderer.invoke('closeTab', tabId)
    } catch (error) {
      console.error('Close tab error:', error)
      return { success: false, error: error.message }
    }
  },
  initializeBrowser: async () => {
    try {
      return await ipcRenderer.invoke('initializeBrowser')
    } catch (error) {
      console.error('Initialize browser error:', error)
      return { success: false, error: error.message }
    }
  },
  onTitleUpdate: (callback) => {
    titleUpdateCallback = callback
  },
  closeWindow: async () => {
    try {
      return await ipcRenderer.invoke('closeWindow')
    } catch (error) {
      console.error('Close window error:', error)
      return { success: false, error: error.message }
    }
  },
  getPageContent: () => ipcRenderer.invoke('getPageContent'),
  onNavigate: (callback) => {
    ipcRenderer.on('page-navigated', (_, data) => callback(data))
  }
})

console.log('Preload script completed')