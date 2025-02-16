"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Home, Bookmark, Settings, Layout, Plus, ChevronLeft, ChevronRight, X, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { BrowserHistory } from "@/components/browserHistory"
import { useUser } from "@/lib/userContext"
import RelevancyEngine  from "@/lib/get_relevancy"

// Extend the Window interface to include the electron property
declare global {
  interface Window {
    electron: {
      navigateToUrl: (url: string) => Promise<{ success: boolean; title?: string; error?: string }>,
      resizeBrowserView: (bounds: { x: number; y: number; width: number; height: number }) => void,
      initializeBrowser: () => Promise<{ success: boolean }>,
      createTab: (id: string) => Promise<{ success: boolean; error?: string }>,
      switchTab: (id: string) => Promise<{ success: boolean; error?: string }>,
      closeTab: (id: string) => Promise<{ success: boolean; error?: string }>,
      onTitleUpdate: (callback: ({ viewId, title }: { viewId: string; title: string }) => void) => void,
      getPageContent: (id: string) => Promise<{ success: boolean; data?: { url: string; title: string; content: string }; error?: string }>
    }
  }
}


interface Tab {
  id: string
  url: string
  title: string
  isActive: boolean
  content: string
  favicon?: string
  relevancyScore?: number
}


export default function BrowserWindow() {

  // can get the user name and prompt from right here !!!!
  const { isAuthenticated } = useUser()

  const [isSplitView, setIsSplitView] = useState(false)
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "1",
      url: "https://perplexity.ai",
      title: "Perplexity AI",
      isActive: true,
      content: "",
    },
  ])
  const [activeTab, setActiveTab] = useState<Tab | null>(tabs[0])
  const [searchInput, setSearchInput] = useState("")
  const [history] = useState(() => new BrowserHistory())

  const createNewTab = async () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      url: "about:blank",
      title: "New Tab",
      isActive: true,
      content: "",
    }

    try {
      const result = await window.electron.createTab(newTab.id)
      if (result.success) {
        const updatedTabs = tabs.map((tab) => ({ ...tab, isActive: false }))
        setTabs([...updatedTabs, newTab])
        setActiveTab(newTab)
        setSearchInput("")
      } else {
        console.error("Failed to create tab:", result.error)
      }
    } catch (error) {
      console.error("Error creating tab:", error)
    }
  }

  useEffect(() => {
    const checkElectronApi = () => {
      if (typeof window !== "undefined" && window.electron) {
        console.log("Electron API is available")
        return true
      }
      console.log("Waiting for Electron API...")
      return false
    }

    if (!checkElectronApi()) {
      const interval = setInterval(() => {
        if (checkElectronApi()) {
          clearInterval(interval)
        }
      }, 100)

      return () => clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (window.electron) {
      window.electron.onTitleUpdate(({ viewId, title }) => {
        setTabs(currentTabs =>
          currentTabs.map(tab => {
            if (tab.isActive) {
              return {
                ...tab,
                title: title || tab.title
              }
            }
            return tab
          })
        )
      })
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && window.electron) {
      // Initialize browser first
      window.electron.initializeBrowser().then(() => {
        // Then navigate to initial URL
        navigateToUrl("https://perplexity.ai")
      })
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined" || !window.electron) {
      return
    }

    const updateBrowserViewBounds = () => {
      const contentElement = document.getElementById("browser-content")
      if (contentElement) {

        const bounds = {
          x: 80, // Width of left sidebar
          y: 64, // Height of top nav
          width: window.innerWidth - 80 - 320, // Full width minus both sidebars
          height: window.innerHeight - 64, // Full height minus top nav
        }

        window.electron.resizeBrowserView(bounds)
      }
    }

    window.addEventListener("resize", updateBrowserViewBounds)
    updateBrowserViewBounds()

    return () => window.removeEventListener("resize", updateBrowserViewBounds)
  }, [isAuthenticated, activeTab])

  const closeTab = async (tabId: string) => {
    try {
      const result = await window.electron.closeTab(tabId)
      if (result.success) {
        if (tabs.length === 1) {
          createNewTab()
        } else {
          const tabIndex = tabs.findIndex((tab) => tab.id === tabId)
          const newTabs = tabs.filter((tab) => tab.id !== tabId)

          if (activeTab?.id === tabId) {
            const newActiveTab = newTabs[Math.min(tabIndex, newTabs.length - 1)]
            await switchTab(newActiveTab)
          } else {
            setTabs(newTabs)
          }
        }
      } else {
        console.error("Failed to close tab:", result.error)
      }
    } catch (error) {
      console.error("Error closing tab:", error)
    }
  }

  const switchTab = async (tab: Tab) => {
    try {
      const result = await window.electron.switchTab(tab.id)
      if (result.success) {
        setActiveTab(tab)
        setTabs(
          tabs.map((t) => ({
            ...t,
            isActive: t.id === tab.id,
          }))
        )
        setSearchInput(tab.url)
      } else {
        console.error("Failed to switch tab:", result.error)
      }
    } catch (error) {
      console.error("Error switching tab:", error)
    }
  }

  const navigateToUrl = async (url) => {
    if (!activeTab) return;

    let fullUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      fullUrl = url.includes(".")
        ? `https://${url}`
        : `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    }

    try {
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTab.id
            ? { ...tab, url: fullUrl, title: "Loading...", content: "Loading..." }
            : tab
        )
      );

      const result = await window.electron.navigateToUrl(fullUrl);

      if (result.success) {
        setTabs(
          tabs.map((tab) =>
            tab.id === activeTab.id
              ? {
                ...tab,
                url: fullUrl,
                title: result.title || new URL(fullUrl).hostname,
                favicon: `https://www.google.com/s2/favicons?domain=${new URL(fullUrl).hostname}&sz=32`,
              }
              : tab
          )
        );
        setSearchInput(fullUrl);
        await updateRelevancyScore(activeTab.id)

      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Navigation error:", error);
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTab.id
            ? { ...tab, title: "Error", content: `Failed to load page: ${error.message}` }
            : tab
        )
      );
    }
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname + urlObj.pathname
    } catch {
      return url
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput) {
      navigateToUrl(searchInput)
    }
  }

  const relevancyEngine = new RelevancyEngine()
  const updateRelevancyScore = async (tabId: string) => {
    try {
      const result = await window.electron.getPageContent(tabId)
      if (result.success) {
        const { url, title, content } = result.data

        // Get user goal from context
        const { userGoal } = useUser()

        // Get the relevancy score
        const score = await relevancyEngine.get_relevancy_score(
          userGoal,
          url,
          title,
          content,
          relevancyEngine.previousRelevancyScores
        )

        // Update the tabs state with the new score
        setTabs(currentTabs =>
          currentTabs.map(tab =>
            tab.id === tabId
              ? { ...tab, relevancyScore: score }
              : tab
          )
        )
        console.log('Relevancy score updated:', score)
      }
    } catch (error) {
      console.error('Error updating relevancy score:', error)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Left Sidebar */}
      <div className="w-20 glass flex flex-col items-center py-6 gap-6 border-r border-white/10">
        <Button
          variant="ghost"
          size="lg"
          className="rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Home className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="lg" className="rounded-2xl hover:bg-white/5 transition-colors">
          <Search className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="lg" className="rounded-2xl hover:bg-white/5 transition-colors">
          <Bookmark className="h-6 w-6" />
        </Button>
        <Separator className="my-2 w-10 bg-white/10" />
        <Button variant="ghost" size="lg" className="rounded-2xl mt-auto hover:bg-white/5 transition-colors">
          <Settings className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-w-0">
        {/* Browser Content */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Navigation Bar */}
          <div className="glass border-b border-white/10 h-16 flex-none flex items-center px-6 gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                disabled={!history.canGoBack()}
                onClick={() => {
                  const entry = history.back()
                  if (entry) navigateToUrl(entry.url)
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                disabled={!history.canGoForward()}
                onClick={() => {
                  const entry = history.forward()
                  if (entry) navigateToUrl(entry.url)
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto">
              <div className="flex items-center bg-white/5 rounded-2xl px-4 h-10 transition-colors focus-within:bg-white/10">
                <Search className="h-4 w-4 mr-3 text-muted-foreground" />
                <Input
                  className="border-0 bg-transparent h-10 p-0 placeholder:text-muted-foreground focus-visible:ring-0 text-sm"
                  placeholder="Search or enter URL"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </form>
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setIsSplitView(!isSplitView)}>
              <Layout className="h-5 w-5" />
            </Button>
          </div>

          {/* Main Browser Content */}
          <div className="flex-1 relative min-h-0">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`absolute inset-0 transition-opacity ${tab.isActive ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
              >
                <div id="browser-content" className="absolute inset-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Tabs */}
        <div className="w-80 glass border-l border-white/10 flex flex-col flex-none">
          <div className="p-4 border-b border-white/10 flex-none">
            <Button onClick={createNewTab} className="w-full rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              New Tab
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`group flex items-center p-3 rounded-xl cursor-pointer transition-colors
          ${tab.isActive ? "bg-white/10" : "hover:bg-white/5"}`}
                  onClick={() => switchTab(tab)}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    {tab.favicon ? (
                      <img
                        src={tab.favicon}
                        alt=""
                        className="h-4 w-4 shrink-0 mr-3"
                        onError={(e) => {
                          e.currentTarget.src = ""
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    ) : (
                      <Globe className="h-4 w-4 shrink-0 mr-3 text-muted-foreground" />
                    )}
                    <div className="truncate">
                      <div className="font-medium truncate">
                        {tab.title}
                        {tab.relevancyScore !== undefined && (
                          <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${tab.relevancyScore >= 7 ? "bg-green-500/20 text-green-300" :
                              tab.relevancyScore >= 4 ? "bg-yellow-500/20 text-yellow-300" :
                                "bg-red-500/20 text-red-300"
                            }`}>
                            {tab.relevancyScore}/10
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {formatUrl(tab.url)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

