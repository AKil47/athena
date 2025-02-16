import { app, BrowserWindow, ipcMain, session } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import isDev from 'electron-is-dev'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: '#1a1a1a'
  })

  mainWindow.loadURL(
    isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../build/index.html')}`
  )

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' http://localhost:3000",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000",
          "style-src 'self' 'unsafe-inline' http://localhost:3000",
          "img-src 'self' data: https: http:",
          "connect-src 'self' https: http:",
        ].join('; ')
      }
    })
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('navigate', async (event, url) => {
  if (!mainWindow) return
  try {
    await mainWindow.loadURL(
      isDev 
        ? `http://localhost:3000${url}` 
        : `file://${path.join(__dirname, `../build${url}/index.html`)}`
    )
    return { success: true }
  } catch (error) {
    console.error('Navigation error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('open-external-url', async (event, url) => {
  if (!mainWindow) return
  try {
    const validUrl = new URL(url)
    if (validUrl.protocol !== 'http:' && validUrl.protocol !== 'https:') {
      throw new Error('Invalid protocol')
    }

    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      parent: mainWindow,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    })

    await win.loadURL(url)
    return { success: true }
  } catch (error) {
    console.error('External URL error:', error)
    return { success: false, error: error.message }
  }
})

if (isDev) {
  try {
    const electronReloader = await import('electron-reloader')
    electronReloader.default(import.meta.url, {
      debug: true,
      watchRenderer: true
    })
  } catch (error) {
    console.error('Error setting up hot reload:', error)
  }
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  if (mainWindow) {
    mainWindow.webContents.send('error', error.message)
  }
})