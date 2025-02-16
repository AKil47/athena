import { app, BrowserWindow, BrowserView, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import isDev from 'electron-is-dev'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow = null
let browserView = null

const createBrowserView = () => {
  browserView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    }
  })
  
  mainWindow.setBrowserView(browserView)
  browserView.setBounds({ x: 0, y: 0, width: 0, height: 0 })
}

function createWindow() {
  const preloadScript = path.join(__dirname, 'preload.cjs')
  console.log('Loading preload script from:', preloadScript)

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: preloadScript
    },
    backgroundColor: '#1a1a1a'
  })

  createBrowserView()

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`

  console.log('Loading application from:', startUrl)
  mainWindow.loadURL(startUrl)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Main window loaded')
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    browserView = null
  })
}

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', () => {
    if (!mainWindow) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers
ipcMain.handle('navigateToUrl', async (event, url) => {
  console.log('Navigate request received:', url)
  if (!browserView) {
    console.error('BrowserView not initialized')
    return { success: false, error: 'BrowserView not initialized' }
  }

  try {
    await browserView.webContents.loadURL(url)
    return { 
      success: true,
      title: browserView.webContents.getTitle(),
      url: browserView.webContents.getURL()
    }
  } catch (error) {
    console.error('Navigation error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('resizeBrowserView', (event, bounds) => {
  if (!browserView) return

  try {
    // No additional calculations needed since we're passing exact coordinates
    browserView.setBounds(bounds)
  } catch (error) {
    console.error('Resize error:', error)
  }
})