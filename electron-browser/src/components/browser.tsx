"use client"

import { useState, useEffect } from "react"
import { Search, Home, Bookmark, Settings, Layout, Plus, ChevronLeft, ChevronRight } from "lucide-react"

// Simple Button Component
const Button = ({ 
  variant = "default", 
  size = "default", 
  className = "", 
  children, 
  disabled = false,
  onClick,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  }
  const sizeStyles = {
    default: "h-10 px-4 py-2",
    icon: "h-10 w-10",
  }
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

// Simple Input Component
const Input = ({ className = "", ...props }) => {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}

// Simple Separator Component
const Separator = ({ className = "", ...props }) => {
  return (
    <div className={`shrink-0 bg-border h-[1px] w-full ${className}`} {...props} />
  )
}

// Simple ScrollArea Component
const ScrollArea = ({ children, className = "" }) => {
  return (
    <div className={`overflow-auto ${className}`}>
      {children}
    </div>
  )
}

export default function Browser() {
  const [url, setUrl] = useState<string>("https://v0.dev")
  const [isSplitView, setIsSplitView] = useState<boolean>(false)
  const [navState, setNavState] = useState({
    canGoBack: false,
    canGoForward: false
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron')

      ipcRenderer.on('navigation-state', (_event: any, state: any) => {
        setNavState(state)
      })

      return () => {
        ipcRenderer.removeAllListeners('navigation-state')
      }
    }
  }, [])

  const handleNavigation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron')
      let navigateUrl = url
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        navigateUrl = `https://${url}`
      }
      ipcRenderer.send('navigate', navigateUrl)
    }
  }

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron')
      ipcRenderer.send('go-back')
    }
  }

  const handleGoForward = () => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron')
      ipcRenderer.send('go-forward')
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-16 bg-gray-100 border-r flex flex-col items-center py-4 gap-4">
        <Button variant="ghost" size="icon" className="rounded-full bg-blue-500 text-white">
          <Home className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bookmark className="h-5 w-5" />
        </Button>
        <Separator className="my-2" />
        <Button variant="ghost" size="icon" className="rounded-full mt-auto">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Tab Bar */}
        <div className="h-12 border-b flex items-center px-4 gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0"
            onClick={handleGoBack}
            disabled={!navState.canGoBack}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0"
            onClick={handleGoForward}
            disabled={!navState.canGoForward}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex-1 flex items-center max-w-xl mx-auto w-full bg-gray-100 rounded-full px-4 h-8">
            <Search className="h-4 w-4 mr-2 text-gray-500" />
            <Input
              className="border-0 bg-transparent h-8 p-0 placeholder:text-gray-500 focus-visible:ring-0"
              placeholder="Search or enter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleNavigation}
            />
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setIsSplitView(!isSplitView)}>
            <Layout className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Content */}
        <div className={`flex-1 ${isSplitView ? "grid grid-cols-2 divide-x" : ""}`}>
          <div className="h-full">
            {typeof window !== 'undefined' && window.require ? (
              <webview
                id="mainWebview"
                src={url}
                className="w-full h-full"
              />
            ) : (
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="rounded-lg border bg-white p-4">
                    <h2 className="text-lg font-semibold mb-2">Welcome to Arc-like Browser</h2>
                    <p className="text-gray-500">This is a demo of an Arc-inspired browser interface.</p>
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
          {isSplitView && (
            <div className="h-full">
              {typeof window !== 'undefined' && window.require ? (
                <webview
                  id="splitWebview"
                  className="w-full h-full"
                />
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <div className="rounded-lg border bg-white p-4">
                      <h2 className="text-lg font-semibold mb-2">Split View</h2>
                      <p className="text-gray-500">This is the split view panel.</p>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}