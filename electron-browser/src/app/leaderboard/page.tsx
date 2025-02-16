"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Home, Trophy, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect } from "react"

interface LeaderboardEntry {
    id: string
    name: string
    avatar?: string
    averageScore: number
    totalSessions: number
    lastActive: string
    isFriend?: boolean
}

declare global {
    interface Window {
      electron: {
        navigateToUrl: (url: string) => Promise<{ success: boolean; title?: string; error?: string }>
        resizeBrowserView: (bounds: { x: number; y: number; width: number; height: number }) => void
        initializeBrowser: () => Promise<{ success: boolean }>
        createTab: (id: string) => Promise<{ success: boolean; error?: string }>
        switchTab: (id: string) => Promise<{ success: boolean; error?: string }>
        closeTab: (id: string) => Promise<{ success: boolean; error?: string }>
        onTitleUpdate: (callback: ({ viewId, title }: { viewId: string; title: string }) => void) => void
        closeWindow: () => Promise<{ success: boolean; error?: string }>
        getPageContent: () => Promise<{ success: boolean; data?: { url: string; title: string; content: string }; error?: string }>
      }
    }
  }
  

export default function LeaderboardPage() {
  const router = useRouter()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([
    {
      id: "1",
      name: "Alice Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      averageScore: 8.7,
      totalSessions: 42,
      lastActive: "2h ago",
      isFriend: true,
    },
    {
      id: "2",
      name: "Bob Smith",
      avatar: "/placeholder.svg?height=40&width=40",
      averageScore: 8.2,
      totalSessions: 38,
      lastActive: "1d ago",
      isFriend: true,
    },
    {
      id: "3",
      name: "Carol Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      averageScore: 7.9,
      totalSessions: 56,
      lastActive: "3h ago",
    },
    // Add more sample data as needed
  ])
  const handleHomeClick = async () => {
    console.log("Home click triggered")
    try {
      // Get the stored tab data
      const savedTab = localStorage.getItem('lastActiveTab')
      if (savedTab && window.electron) {
        console.log("Found saved tab:", savedTab)
        const parsedTab = JSON.parse(savedTab)
        
        // First restore the browser view
        const bounds = {
          x: 80,
          y: 64,
          width: window.innerWidth - 80 - 320,
          height: window.innerHeight - 64,
        }
        await window.electron.resizeBrowserView(bounds)
        console.log("Browser view resized")
        
        // Then switch to the saved tab
        const result = await window.electron.switchTab(parsedTab.id)
        console.log("Switch tab result:", result)
        
        if (result.success) {
          // Show browser window and hide leaderboard
          const browserWindow = document.querySelector('.browser-window')
          const leaderboard = document.querySelector('.leaderboard-page')
          
          if (browserWindow instanceof HTMLElement) {
            browserWindow.style.display = 'flex'
            console.log("Browser window shown")
          }
          
          if (leaderboard instanceof HTMLElement) {
            leaderboard.style.display = 'none'
            console.log("Leaderboard hidden")
          }
        }
      }
    } catch (error) {
      console.error('Error in handleHomeClick:', error)
    }
  }


  useEffect(() => {
    try {
      const browserWindow = document.querySelector('.browser-window')
      if (browserWindow instanceof HTMLElement) {
        browserWindow.style.display = 'none'
      }

      if (window.electron) {
        window.electron.resizeBrowserView({
          x: 0,
          y: 0,
          width: 0,
          height: 0
        })
      }
    } catch (error) {
      console.error('Error in leaderboard mount effect:', error)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-full overflow-hidden bg-background">
      {/* Rest of your JSX remains the same */}
      <div className="w-20 glass flex flex-col items-center py-6 gap-6 border-r border-white/10">
        <Button
          variant="ghost"
          size="lg"
          onClick={handleHomeClick}
          className="rounded-2xl hover:bg-white/5 transition-colors"
        >
          <Home className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Trophy className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="glass border-b border-white/10 h-16 flex items-center px-6">
          <Button variant="ghost" size="icon" className="rounded-xl mr-4" onClick={handleHomeClick}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Leaderboard</h1>
        </header>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {leaderboardData.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center p-4 rounded-2xl ${
                  entry.isFriend ? "bg-primary/5 border border-primary/10" : "bg-white/5"
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-8 text-lg font-semibold text-muted-foreground">
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.avatar} />
                    <AvatarFallback>{entry.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{entry.name}</div>
                      {entry.isFriend && (
                        <div className="px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">Friend</div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Last active {entry.lastActive}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{entry.averageScore.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">{entry.totalSessions} sessions</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

