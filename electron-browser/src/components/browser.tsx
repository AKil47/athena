"use client"

import { useState, useRef } from "react"
import { Search, Home, Bookmark, Settings, Layout, Plus, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { BrowserHistory } from "./browserHistory"
import { useEffect } from "react"

interface Tab {
    id: string
    url: string
    title: string
    isActive: boolean
    content: string
}

const quickLinks = [
    { icon: Home, title: "Homepage", url: "https://v0.dev" },
    { icon: Bookmark, title: "Bookmarks", url: "https://v0.dev/bookmarks" },
]

export default function Browser() {

    const [hasShownWelcome, setHasShownWelcome] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true)
    const [userName, setUserName] = useState("")
    const [userGoal, setUserGoal] = useState("")
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

    const handleWelcomeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userName && userGoal) {
            console.log("Start Browsing clicked");
            console.log("Before state update - hasShownWelcome:", hasShownWelcome);
            console.log("Before state update - showWelcome:", showWelcome);

            setHasShownWelcome(true);
            setShowWelcome(false);

            console.log("After state update - hasShownWelcome:", hasShownWelcome);
            console.log("After state update - showWelcome:", showWelcome);
        }
    };



    const createNewTab = () => {
        const newTab: Tab = {
            id: Date.now().toString(),
            url: "about:blank",
            title: "New Tab",
            isActive: true,
            content: "",
        }
        console.log("Rendering Browser Component");
        console.log("showWelcome:", showWelcome);
        console.log("hasShownWelcome:", hasShownWelcome);


        const updatedTabs = tabs.map((tab) => ({ ...tab, isActive: false }))
        setTabs([...updatedTabs, newTab])
        setActiveTab(newTab)
        setSearchInput("")
    }

    const closeTab = (tabId: string) => {
        if (tabs.length === 1) {
            createNewTab()
        }

        const tabIndex = tabs.findIndex(tab => tab.id === tabId)
        const newTabs = tabs.filter(tab => tab.id !== tabId)

        if (activeTab?.id === tabId) {
            const newActiveTab = newTabs[Math.min(tabIndex, newTabs.length - 1)]
            setActiveTab(newActiveTab)
            setTabs(newTabs.map(tab => ({
                ...tab,
                isActive: tab.id === newActiveTab.id
            })))
        } else {
            setTabs(newTabs)
        }
    }

    const switchTab = (tab: Tab) => {
        setActiveTab(tab)
        setTabs(tabs.map(t => ({
            ...t,
            isActive: t.id === tab.id
        })))
        setSearchInput(tab.url)
    }

    const navigateToUrl = async (url: string) => {
        if (!activeTab) return

        const fullUrl = url.startsWith("http") ? url : `https://${url}`

        try {
            setTabs(
                tabs.map((tab) =>
                    tab.id === activeTab.id ? { ...tab, url: fullUrl, title: "Loading...", content: "Loading..." } : tab,
                ),
            )

            const response = await fetch(fullUrl)
            const content = await response.text()

            history.push(fullUrl, url)

            setTabs(tabs.map((tab) =>
                tab.id === activeTab.id ? { ...tab, url: fullUrl, title: url, content } : tab
            ))

            setSearchInput(fullUrl)
        } catch (error) {
            setTabs(
                tabs.map((tab) =>
                    tab.id === activeTab.id ? { ...tab, title: "Error", content: "Failed to load page" } : tab
                ),
            )
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchInput) {
            navigateToUrl(searchInput)
        }
    }

    useEffect(() => {
        console.log("State updated - hasShownWelcome:", hasShownWelcome);
        console.log("State updated - showWelcome:", showWelcome);
      }, [hasShownWelcome, showWelcome]);
      

    if (showWelcome && !hasShownWelcome) {
        console.log("Showing Welcome Screen");
        return (
            <div className="fixed inset-0 bg-background/95 backdrop-blur flex items-center justify-center">
                <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full">
                    <h1 className="text-2xl font-bold mb-6">Welcome to Athena</h1>
                    <form onSubmit={handleWelcomeSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                What's your name?
                            </label>
                            <Input
                                id="name"
                                placeholder="Enter your name"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="goal" className="text-sm font-medium">
                                What's your goal for this session?
                            </label>
                            <Input
                                id="goal"
                                placeholder="e.g., Research machine learning, Learn about history..."
                                value={userGoal}
                                onChange={(e) => setUserGoal(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            Start Browsing
                        </Button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background">
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
                <div className="border-b">
                    <div className="flex items-center px-2 h-8">
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                className={`flex items-center px-4 py-1 border-r cursor-pointer hover:bg-muted/40 ${tab.isActive ? 'bg-muted/40' : ''
                                    }`}
                                onClick={() => switchTab(tab)}
                            >
                                <span className="truncate max-w-[120px]">{tab.title}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 ml-2"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        closeTab(tab.id)
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                        <Button variant="ghost" size="icon" className="ml-2" onClick={createNewTab}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="h-12 flex items-center px-4 gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            disabled={!history.canGoBack()}
                            onClick={() => {
                                const entry = history.back()
                                if (entry) {
                                    navigateToUrl(entry.url)
                                }
                            }}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            disabled={!history.canGoForward()}
                            onClick={() => {
                                const entry = history.forward()
                                if (entry) {
                                    navigateToUrl(entry.url)
                                }
                            }}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <form onSubmit={handleSearch} className="flex-1 flex items-center max-w-xl mx-auto w-full">
                            <div className="flex-1 flex items-center bg-muted/40 rounded-full px-4 h-8">
                                <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input
                                    className="border-0 bg-transparent h-8 p-0 placeholder:text-muted-foreground focus-visible:ring-0"
                                    placeholder="Search or enter URL"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                            </div>
                        </form>
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setIsSplitView(!isSplitView)}>
                            <Layout className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className={`flex-1 ${isSplitView ? "grid grid-cols-2 divide-x" : ""}`}>
                    <div className="h-full">
                        <ScrollArea className="h-full">
                            <div className="p-4">
                                <div className="rounded-lg border bg-card p-4">
                                    <h2 className="text-lg font-semibold mb-2">Welcome, {userName}!</h2>
                                    <p className="text-muted-foreground">Your goal: {userGoal}</p>
                                </div>
                                <div className="mt-4 grid gap-2">
                                    {quickLinks.map((link, index) => {
                                        const Icon = link.icon
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                className="h-24 flex flex-col items-center justify-center gap-2"
                                                onClick={() => navigateToUrl(link.url)}
                                            >
                                                <Icon className="h-6 w-6" />
                                                <span>{link.title}</span>
                                            </Button>
                                        )
                                    })}
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                    {isSplitView && (
                        <div className="h-full">
                            <ScrollArea className="h-full">
                                <div className="p-4">
                                    <div className="rounded-lg border bg-card p-4">
                                        <h2 className="text-lg font-semibold mb-2">Split View</h2>
                                        <p className="text-muted-foreground">This is the split view panel.</p>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}