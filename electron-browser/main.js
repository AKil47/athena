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
  // Set a lower z-index for the BrowserView
  view.setBackgroundColor('#ffffff')
  view.webContents.setZoomFactor(1.0)
  view.webContents.setVisualZoomLevelLimits(1, 1)
  view.setAutoResize({ width: true, height: true })
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

  browserView = createBrowserView()
  browserViews.set('1', browserView)

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`
  
  mainWindow.loadURL(startUrl)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  browserView.webContents.on('did-navigate', (event, url) => {
    const activeViewId = Array.from(browserViews.entries())
      .find(([_, view]) => view === browserView)?.[0]
    
    if (activeViewId) {
      mainWindow.webContents.send('page-navigated', {
        viewId: activeViewId,
        url: url
      })
    }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (!mainWindow) {
    createWindow()
  }
})

ipcMain.handle('closeWindow', () => {
  if (!mainWindow) {
    return { success: false, error: 'Window not found' }
  }
  
  try {
    // Hide the browser view before closing
    if (browserView) {
      browserView.setBounds({ x: 0, y: 0, width: 0, height: 0 })
    }
    mainWindow.close()
    return { success: true }
  } catch (error) {
    console.error('Error closing window:', error)
    return { success: false, error: error.message }
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
    // If the bounds are all 0, hide the view completely
    if (bounds.width === 0 && bounds.height === 0) {
      mainWindow.removeBrowserView(browserView)
    } else {
      mainWindow.addBrowserView(browserView)
      browserView.setBounds(bounds)
    }
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
    // Get only visible text content without modifying the original page
    const visibleText = await browserView.webContents.executeJavaScript(`
      (function() {
        // Create a clone of the document body to work with
        const clone = document.body.cloneNode(true);
        
        // Remove script and style elements from the clone
        clone.querySelectorAll('script, style').forEach(el => el.remove());
        
        // Get visible text from the clone
        const visibleText = Array.from(clone.getElementsByTagName('*'))
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
        
        // Clean up
        clone.remove();
        
        return visibleText;
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
