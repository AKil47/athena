"use client"

import { useState, useEffect } from "react"
import { Search, Home, Bookmark, Settings, Layout, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "../components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "../ui/separator"

interface NavigationState {
  canGoBack: boolean
  canGoForward: boolean
}

export default function Browser() {
  const [url, setUrl] = useState<string>("https://v0.dev")
  const [isSplitView, setIsSplitView] = useState<boolean>(false)
  const [navState, setNavState] = useState<NavigationState>({
    canGoBack: false,
    canGoForward: false
  })

  useEffect(() => {
    // Only initialize electron-specific features if running in electron
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron')

      ipcRenderer.on('navigation-state', (_event: any, state: NavigationState) => {
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
      <div className="w-16 bg-muted/40 border-r flex flex-col items-center py-4 gap-4">
        <Button variant="ghost" size="icon" className="rounded-full bg-primary text-primary-foreground">
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
          <div className="flex-1 flex items-center max-w-xl mx-auto w-full bg-muted/40 rounded-full px-4 h-8">
            <Search className="h-4 w-4 mr-2 text-muted-foreground" />
            <Input
              className="border-0 bg-transparent h-8 p-0 placeholder:text-muted-foreground focus-visible:ring-0"
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
                  <div className="rounded-lg border bg-card p-4">
                    <h2 className="text-lg font-semibold mb-2">Welcome to Arc-like Browser</h2>
                    <p className="text-muted-foreground">This is a demo of an Arc-inspired browser interface.</p>
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
                    <div className="rounded-lg border bg-card p-4">
                      <h2 className="text-lg font-semibold mb-2">Split View</h2>
                      <p className="text-muted-foreground">This is the split view panel.</p>
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