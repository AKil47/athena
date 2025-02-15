const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
    }
  })

  // Load the Next.js app
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  )

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// Handle navigation events
ipcMain.on('navigate', (_event, url) => {
  if (mainWindow) {
    mainWindow.webContents.loadURL(url)
  }
})

// Handle navigation state
ipcMain.on('get-nav-state', (event) => {
  if (mainWindow) {
    event.reply('navigation-state', {
      canGoBack: mainWindow.webContents.canGoBack(),
      canGoForward: mainWindow.webContents.canGoForward()
    })
  }
})