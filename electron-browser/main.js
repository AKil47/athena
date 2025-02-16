// main.js
import { app, BrowserWindow, BrowserView, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import isDev from 'electron-is-dev'
import RelevancyEngine from './src/lib/get_relevancy.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow = null
let browserView = null
const browserViews = new Map()

// Add relevancy engine instance
const relevancyEngine = new RelevancyEngine()
let userGoal = null  // We'll need to set this via IPC

const createBrowserView = () => {
  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  })
  
  mainWindow.setBrowserView(view)
  view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
  return view
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

  // Create initial browser view
  browserView = createBrowserView()
  browserViews.set('1', browserView)

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
    browserViews.clear()
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

// Tab management handlers
ipcMain.handle('createTab', (event, tabId) => {
  try {
    const view = createBrowserView()
    browserViews.set(tabId, view)
    browserView = view
    mainWindow.setBrowserView(view)
    return { success: true }
  } catch (error) {
    console.error('Error creating tab:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('switchTab', (event, tabId) => {
  try {
    const view = browserViews.get(tabId)
    if (view) {
      browserView = view
      mainWindow.setBrowserView(view)
      return { success: true }
    }
    return { success: false, error: 'Tab not found' }
  } catch (error) {
    console.error('Error switching tab:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('closeTab', (event, tabId) => {
  try {
    const view = browserViews.get(tabId)
    if (view) {
      view.webContents.destroy()
      browserViews.delete(tabId)
      return { success: true }
    }
    return { success: false, error: 'Tab not found' }
  } catch (error) {
    console.error('Error closing tab:', error)
    return { success: false, error: error.message }
  }
})

// Navigation and resize handlers
ipcMain.handle('navigateToUrl', async (event, url) => {
  console.log('Navigate request received:', url)
  if (!browserView) {
    console.error('BrowserView not initialized')
    return { success: false, error: 'BrowserView not initialized' }
  }
  
  try {
    await browserView.webContents.loadURL(url)
    
    // Get page details for relevancy check
    const title = browserView.webContents.getTitle()
    const pageUrl = browserView.webContents.getURL()
    const htmlSource = await browserView.webContents.executeJavaScript(
      'document.documentElement.outerHTML'
    )

    // Calculate relevancy if we have a user goal
    if (userGoal) {
      const relevancyScore = await relevancyEngine.get_relevancy_score(
        userGoal,
        pageUrl,
        title,
        htmlSource,
        relevancyEngine.previousRelevancyScores
      )
      console.log(`Relevancy score for ${title}: ${relevancyScore}`)
    }

    return { 
      success: true,
      title: title,
      url: pageUrl
    }
  } catch (error) {
    console.error('Navigation error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('resizeBrowserView', (event, bounds) => {
  if (!browserView) return
  try {
    browserView.setBounds(bounds)
  } catch (error) {
    console.error('Resize error:', error)
  }
})

// Add IPC handler for setting user goal
ipcMain.handle('setUserGoal', (event, goal) => {
  userGoal = goal
  return { success: true }
})

// Add this new IPC handler
ipcMain.handle('getPageContent', async () => {
  if (!browserView) {
    return { success: false, error: 'BrowserView not initialized' }
  }
  
  try {
    const title = browserView.webContents.getTitle()
    const pageUrl = browserView.webContents.getURL()
    // Get only visible text content
    const visibleText = await browserView.webContents.executeJavaScript(`
      (function() {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());
        
        // Get visible text
        return Array.from(document.body.getElementsByTagName('*'))
          .map(element => {
            const style = window.getComputedStyle(element);
            const isVisible = style.display !== 'none' && 
                            style.visibility !== 'hidden' && 
                            style.opacity !== '0';
            
            if (isVisible) {
              return element.innerText;
            }
            return '';
          })
          .join(' ')
          .replace(/\\s+/g, ' ')
          .trim()
          .substring(0, 4000); // Limit to first 4000 characters
      })()
    `)
    
    return {
      success: true,
      data: {
        title,
        url: pageUrl,
        content: visibleText
      }
    }
  } catch (error) {
    console.error('Error getting page content:', error)
    return { success: false, error: error.message }
  }
})