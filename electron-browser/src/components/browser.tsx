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
import { useRouter } from "next/navigation"

// Extend the Window interface to include the electron property
declare global {
  interface Window {
    electron: {
      navigateToUrl: (url: string) => Promise<{ success: boolean; error?: string }>
      resizeBrowserView: (bounds: { x: number; y: number; width: number; height: number }) => void
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
}

const quickLinks = [
  { icon: Home, title: "Homepage", url: "https://perplexity.ai" },
  { icon: Bookmark, title: "Bookmarks", url: "https://v0.dev/bookmarks" },
]

export default function BrowserWindow() {
  const { userName, userGoal, isAuthenticated } = useUser()
  const router = useRouter()

  const [url, setUrl] = useState("https://www.perplexity.ai/")
  const [isSplitView, setIsSplitView] = useState(false)
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "1",
      url: "https://www.perplexity.ai/",
      title: "Home",
      isActive: true,
      content: "",
    },
  ])
  const [activeTab, setActiveTab] = useState<Tab | null>(tabs[0])
  const [searchInput, setSearchInput] = useState("")
  const [history] = useState(() => new BrowserHistory())

  const createNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      url: "about:blank",
      title: "New Tab",
      isActive: true,
      content: "",
    }

    const updatedTabs = tabs.map((tab) => ({ ...tab, isActive: false }))
    setTabs([...updatedTabs, newTab])
    setActiveTab(newTab)
    setSearchInput("")
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
    if (!isAuthenticated || typeof window === "undefined" || !window.electron) {
      return
    }

    const updateBrowserViewBounds = () => {
      const contentElement = document.getElementById("browser-content")
      if (contentElement) {
        const rect = contentElement.getBoundingClientRect()

        // Calculate the available space
        // Left sidebar is 80px, right sidebar is 320px
        // Top navigation is 64px
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
    updateBrowserViewBounds() // Initial resize

    return () => window.removeEventListener("resize", updateBrowserViewBounds)
  }, [isAuthenticated, activeTab])

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) {
      createNewTab()
    }

    const tabIndex = tabs.findIndex((tab) => tab.id === tabId)
    const newTabs = tabs.filter((tab) => tab.id !== tabId)

    if (activeTab?.id === tabId) {
      const newActiveTab = newTabs[Math.min(tabIndex, newTabs.length - 1)]
      setActiveTab(newActiveTab)
      setTabs(
        newTabs.map((tab) => ({
          ...tab,
          isActive: tab.id === newActiveTab.id,
        })),
      )
    } else {
      setTabs(newTabs)
    }
  }

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    setTabs(
      tabs.map((t) => ({
        ...t,
        isActive: t.id === tab.id,
      })),
    )
    setSearchInput(tab.url)
  }

  const navigateToUrl = async (url: string) => {
    if (!activeTab) return

    let fullUrl = url
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      fullUrl = url.includes(".") ? `https://${url}` : `https://www.google.com/search?q=${encodeURIComponent(url)}`
    }

    try {
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTab.id ? { ...tab, url: fullUrl, title: "Loading...", content: "Loading..." } : tab,
        ),
      )

      const result = await window.electron.navigateToUrl(fullUrl)

      if (result.success) {
        const favicon = `https://www.google.com/s2/favicons?domain=${new URL(fullUrl).hostname}&sz=32`

        setTabs(
          tabs.map((tab) =>
            tab.id === activeTab.id
              ? {
                ...tab,
                url: fullUrl,
                title: new URL(fullUrl).hostname,
                favicon,
              }
              : tab,
          ),
        )

        setSearchInput(fullUrl)
        history.push(fullUrl, url)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Navigation error:", error)
      setTabs(
        tabs.map((tab) => (tab.id === activeTab.id ? { ...tab, title: "Error", content: "Failed to load page" } : tab)),
      )
    }
  }

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname + urlObj.pathname
    } catch {
      return url
    }
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput) {
      navigateToUrl(searchInput)
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
                        src={tab.favicon || "/placeholder.svg"}
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
                      <div className="font-medium truncate">{tab.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{formatUrl(tab.url)}</div>
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

