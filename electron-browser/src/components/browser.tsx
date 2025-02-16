"use client"

import type React from "react"

import { useState } from "react"
import { Search, Home, Bookmark, Settings, Layout, Plus, ChevronLeft, ChevronRight, X, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { BrowserHistory } from "@/components/browserHistory"
import { useUser } from "@/lib/userContext"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface Tab {
  id: string
  url: string
  title: string
  isActive: boolean
  content: string
  favicon?: string
}

const quickLinks = [
  { icon: Home, title: "Homepage", url: "https://v0.dev" },
  { icon: Bookmark, title: "Bookmarks", url: "https://v0.dev/bookmarks" },
]

export default function BrowserWindow() {
  const { userName, userGoal, isAuthenticated } = useUser()
  const router = useRouter()
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])
    const [url, setUrl] = useState("https://v0.dev")
  const [isSplitView, setIsSplitView] = useState(false)
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "1",
      url: "https://v0.dev",
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
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Check if it's a search query or URL
      fullUrl = url.includes('.') ? `https://${url}` : `https://www.google.com/search?q=${encodeURIComponent(url)}`
    }
  
    try {
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTab.id
            ? { ...tab, url: fullUrl, title: "Loading...", content: "Loading..." }
            : tab
        )
      )
  
      // For favicon
      const favicon = `https://www.google.com/s2/favicons?domain=${new URL(fullUrl).hostname}&sz=32`
  
      // Update tab with new content
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTab.id
            ? {
                ...tab,
                url: fullUrl,
                title: new URL(fullUrl).hostname,
                favicon,
              }
            : tab
        )
      )
  
      setSearchInput(fullUrl)
      history.push(fullUrl, url)
    } catch (error) {
      console.error('Navigation error:', error)
      setTabs(
        tabs.map((tab) =>
          tab.id === activeTab.id
            ? { ...tab, title: "Error", content: "Failed to load page" }
            : tab
        )
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
    <div className="flex h-screen bg-background">
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
      <div className="flex-1 flex">
        {/* Browser Content */}
        <div className="flex-1 flex flex-col">
          {/* Navigation Bar */}
          <div className="glass border-b border-white/10 h-16 flex items-center px-6 gap-4">
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
          </div>

          {/* Main Browser Content */}
          <div className="flex-1 relative">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`absolute inset-0 transition-opacity ${
                  tab.isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <iframe
                  src={tab.url}
                  className="w-full h-full border-none"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  title={tab.title}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Tabs */}
        <div className="w-80 glass border-l border-white/10">
          <div className="p-4 border-b border-white/10">
            <Button 
              onClick={createNewTab}
              className="w-full rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Tab
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <div className="p-2 space-y-2">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`group flex items-center p-3 rounded-xl cursor-pointer transition-colors
                    ${tab.isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  onClick={() => switchTab(tab)}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Globe className="h-4 w-4 shrink-0 mr-3 text-muted-foreground" />
                    <div className="truncate">
                      <div className="font-medium truncate">{tab.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{tab.url}</div>
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
