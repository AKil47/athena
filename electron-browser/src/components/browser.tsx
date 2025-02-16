"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Home, Trophy, Layout, Plus, ChevronLeft, ChevronRight, X, Globe, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BrowserHistory } from "./browserHistory"
import { useUser } from "@/lib/userContext"
import RelevancyEngine from "@/lib/get_relevancy"
import BrowserCloseHandler from "./browser-close-handler"
import { useRouter } from "next/navigation"
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

// Extend Window interface for Electron
declare global {
  interface Window {
    electron: {
      removeBrowserView: () => Promise<void>,
      navigateToUrl: (url: string) => Promise<{ success: boolean; title?: string; error?: string }>,
      initializeBrowser: () => Promise<{ success: boolean }>,
      createTab: (id: string) => Promise<{ success: boolean; error?: string }>,
      switchTab: (id: string) => Promise<{ success: boolean; error?: string }>,
      closeTab: (id: string) => Promise<{ success: boolean; error?: string }>,
      onTitleUpdate: (callback: ({ viewId, title }: { viewId: string; title: string }) => void) => void,
      getPageContent: (id: string) => Promise<{ success: boolean; data?: { url: string; title: string; content: string }; error?: string }>,
      onNavigate: (callback: ({ viewId, url }: { viewId: string; url: string }) => void) => void,
      resizeBrowserView: (options: { x: number; y: number; width: number; height: number }) => Promise<void>
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
  justification?: string
}

export default function BrowserWindow() {
  const router = useRouter()
  const { isAuthenticated, userGoal } = useUser()
  const [lastActiveTab, setLastActiveTab] = useState<Tab | null>(null)
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
  const [relevancyDebounceMap] = useState(new Map())

  // Store last active tab when switching
  useEffect(() => {
    if (activeTab) {
      setLastActiveTab(activeTab)
    }
  }, [activeTab])

  // Initialize Electron API
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

  // Title update handler
  useEffect(() => {
    if (window.electron) {
      window.electron.onTitleUpdate(({ viewId, title }) => {
        setTabs(currentTabs =>
          currentTabs.map(tab => {
            if (tab.isActive) {
              return { ...tab, title: title || tab.title }
            }
            return tab
          })
        )
      })
    }
  }, [])

  // Initialize browser and navigate to initial URL
  useEffect(() => {
    if (isAuthenticated && window.electron) {
      window.electron.initializeBrowser().then(() => {
        navigateToUrl("https://perplexity.ai")
      })
    }
  }, [isAuthenticated])

  // Browser view resize handler
  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined" || !window.electron) {
      return
    }

    const updateBrowserViewBounds = () => {
      const contentElement = document.getElementById("browser-content")
      if (contentElement) {
        const bounds = {
          x: 80,
          y: 64,
          width: window.innerWidth - 80 - 320,
          height: window.innerHeight - 64,
        }
        window.electron.resizeBrowserView(bounds)
      }
    }

    window.addEventListener("resize", updateBrowserViewBounds)
    updateBrowserViewBounds()

    return () => window.removeEventListener("resize", updateBrowserViewBounds)
  }, [isAuthenticated, activeTab])

  const handleHomeClick = () => {
    if (lastActiveTab) {
      switchTab(lastActiveTab)
    }
  }


  const navigateToUrl = async (url: string) => {
    if (!activeTab) return

    let fullUrl = url
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      fullUrl = url.includes(".")
        ? `https://${url}`
        : `https://www.google.com/search?q=${encodeURIComponent(url)}`
    }

    try {
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTab.id
            ? { ...tab, url: fullUrl, title: "Loading...", content: "Loading..." }
            : tab
        )
      )

      const result = await window.electron.navigateToUrl(fullUrl)

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
        )
        setSearchInput(fullUrl)
        await updateRelevancyScore(activeTab.id)
        history.push(fullUrl, result.title || new URL(fullUrl).hostname)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Navigation error:", error)
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTab.id
            ? { ...tab, title: "Error", content: `Failed to load page: ${error.message}` }
            : tab
        )
      )
    }
  }

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
        setTabs((prevTabs) => [...prevTabs.map(tab => ({ ...tab, isActive: false })), newTab])
        setActiveTab(newTab)
        setSearchInput("")
      }
    } catch (error) {
      console.error("Error creating tab:", error)
    }
  }

  const closeTab = async (id: string) => {
    try {
      const result = await window.electron.closeTab(id)
      if (result.success) {
        if (tabs.length === 1) {
          createNewTab()
        } else {
          const index = tabs.findIndex((tab) => tab.id === id)
          const newTabs = tabs.filter((tab) => tab.id !== id)

          if (activeTab?.id === id) {
            const newActiveTab = newTabs[Math.min(index, newTabs.length - 1)]
            await switchTab(newActiveTab)
          }
          setTabs(newTabs)
        }
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
        setTabs(tabs.map((t) => ({ ...t, isActive: t.id === tab.id })))
        setSearchInput(tab.url)
      }
    } catch (error) {
      console.error("Error switching tab:", error)
    }
  }

  const handleLeaderboardClick = async () => {
    // Save current tab state
    if (activeTab) {
      localStorage.setItem('lastActiveTab', JSON.stringify({
        id: activeTab.id,
        url: activeTab.url,
        title: activeTab.title,
        content: activeTab.content,
        favicon: activeTab.favicon,
        relevancyScore: activeTab.relevancyScore
      }))
    }

    // Hide browser view before navigation
    if (window.electron) {
      const bounds = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
      await window.electron.resizeBrowserView(bounds)
    }

    router.push("/leaderboard")
  }


  useEffect(() => {
    const savedTab = localStorage.getItem('lastActiveTab')
    if (savedTab) {
      const parsedTab = JSON.parse(savedTab)
      // Only restore if the tab still exists
      const existingTab = tabs.find(tab => tab.id === parsedTab.id)
      if (existingTab) {
        switchTab(existingTab)
      }
    }
  }, [])

  useEffect(() => {
    // Restore browser view when component mounts
    const updateBrowserViewBounds = () => {
      if (!window.electron) return

      const contentElement = document.getElementById("browser-content")
      if (contentElement) {
        const bounds = {
          x: 80,
          y: 64,
          width: window.innerWidth - 80 - 320,
          height: window.innerHeight - 64,
        }
        window.electron.resizeBrowserView(bounds)
      }
    }

    updateBrowserViewBounds()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim() === "") return
    navigateToUrl(searchInput)
  }

  const formatUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url)
      return parsedUrl.hostname
    } catch {
      return url
    }
  }

  const relevancyEngine = new RelevancyEngine()
  const updateRelevancyScore = async (tabId: string) => {
    // Clear any existing timeout for this tab
    if (relevancyDebounceMap.has(tabId)) {
      clearTimeout(relevancyDebounceMap.get(tabId))
    }

    // Set new timeout
    const timeoutId = setTimeout(async () => {
      try {
        const result = await window.electron.getPageContent(tabId)
        if (result.success) {
          const { url, title, content } = result.data
          
          const { score, justification } = await relevancyEngine.get_relevancy_score(
            userGoal,
            url,
            title,
            content,
            relevancyEngine.previousRelevancyScores
          )

          setTabs(currentTabs =>
            currentTabs.map(tab =>
              tab.id === tabId
                ? { ...tab, relevancyScore: score, justification: justification }
                : tab
            )
          )
          console.log('Relevancy score updated:', score)
        }
      } catch (error) {
        console.error('Error updating relevancy score:', error)
      } finally {
        relevancyDebounceMap.delete(tabId)
      }
    }, 500) // 500ms debounce

    relevancyDebounceMap.set(tabId, timeoutId)
  }

  useEffect(() => {
    if (window.electron) {
      window.electron.onNavigate(({ viewId, url }) => {
        // Find the tab that navigated
        const navigatedTab = tabs.find(tab => tab.id === viewId)
        if (navigatedTab) {
          // Update the tab's URL, title, and favicon
          setTabs(currentTabs =>
            currentTabs.map(tab =>
              tab.id === viewId
                ? {
                    ...tab,
                    url,
                    title: new URL(url).hostname, // Set initial title to hostname
                    favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`
                  }
                : tab
            )
          )
          // Update relevancy score for the navigated tab
          updateRelevancyScore(viewId)
        }
      })
    }
  }, [tabs])

  const truncateTitle = (title: string, maxLength: number) => {
    if (title.length <= maxLength) return title;
    return title.slice(0, maxLength) + '...';
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-indigo-950">
      {/* Left Sidebar */}
      <div className="w-20 glass flex flex-col items-center py-6 gap-6 border-r border-white/10">
        <Button
          variant="ghost"
          size="lg"
          onClick={handleHomeClick}
          className="rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Home className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleLeaderboardClick}
          className="rounded-2xl hover:bg-white/5 transition-colors"
        >
          <Trophy className="h-6 w-6" />
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
                className={`absolute inset-0 transition-opacity ${tab.isActive ? "opacity-100 z-10" : "opacity-0 z-0"}`}
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
                  data-relevancy-score={tab.relevancyScore}
                  className={`group flex items-center p-3 rounded-xl cursor-pointer transition-colors
                    ${tab.isActive ? "bg-white/10" : "hover:bg-white/5"}`}
                  onClick={() => switchTab(tab)}
                >
                  <div className="flex items-center flex-1 min-w-0 pl-1"> {/* Adjust the padding-left as needed */}
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
                      <div className="font-medium">
                        {truncateTitle(tab.title, 18)} {/* Adjust the maxLength as needed */}
                        {tab.relevancyScore !== undefined && (
                          <TooltipProvider>
                            <TooltipRoot>
                              <TooltipTrigger asChild>
                                <span
                                  className={`ml-2 px-1.5 py-0.5 text-xs rounded-full cursor-help ${
                                    tab.relevancyScore >= 7
                                      ? "bg-green-500/20 text-green-300"
                                      : tab.relevancyScore >= 4
                                      ? "bg-yellow-500/20 text-yellow-300"
                                      : "bg-red-500/20 text-red-300"
                                  }`}
                                >
                                  {tab.relevancyScore}/10
                                </span>
                              </TooltipTrigger>
                              {tab.justification && (
                                <TooltipContent side="right" className="max-w-[300px]">
                                  {tab.justification}
                                </TooltipContent>
                              )}
                            </TooltipRoot>
                          </TooltipProvider>
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
      <BrowserCloseHandler />
    </div>
  )
}

