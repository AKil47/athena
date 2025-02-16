"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Home, Trophy, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/lib/userContext"

interface LeaderboardEntry {
    id: string
    name: string
    avatar?: string
    averageScore: number
    totalSessions: number
    lastActive: string
    isFriend?: boolean
}

export default function LeaderboardPage() {
  const router = useRouter()
  const { userName } = useUser()
  const [leaderboardData] = useState<LeaderboardEntry[]>(() => [
    {
      id: "1",
      name: userName, // Use the user's name from context
      avatar: "/baby_totoro.png?height=40&width=40",
      averageScore: 8.7,
      totalSessions: 42,
      lastActive: "2h ago",
      isFriend: true,
    },
    {
      id: "2",
      name: "Bob Smith",
      avatar: "/cat_fishbag.png?height=40&width=40",
      averageScore: 8.2,
      totalSessions: 38,
      lastActive: "1d ago",
      isFriend: true,
    },
  ])

  const handleBackToBrowser = async () => {
    try {
      if (window.electron) {
        // Navigate to browser page
        router.push('/browser')
      }
    } catch (error) {
      console.error('Error returning to browser:', error)
    }
  }

  // Hide browser view when component mounts and cleanup properly
  useEffect(() => {
    let isMounted = true

    const hideBrowserView = async () => {
      try {
        if (window.electron) {
          await window.electron.resizeBrowserView({
            x: 0,
            y: 0,
            width: 0,
            height: 0
          })
        }
      } catch (error) {
        console.error('Error hiding browser view:', error)
      }
    }

    if (isMounted) {
      hideBrowserView()
    }

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-full overflow-hidden bg-indigo-950">
      {/* Sidebar */}
      <div className="w-20 glass flex flex-col items-center py-6 gap-6 border-r border-primary/10 backdrop-blur-md">
        <Button
          variant="ghost"
          size="lg"
          onClick={handleBackToBrowser}
          className="rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors"
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
        <header className="glass border-b border-primary/10 h-16 flex items-center px-6 backdrop-blur-md">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl mr-4 hover:bg-primary/10 hover:text-primary"
            onClick={handleBackToBrowser}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-primary-foreground">Leaderboard</h1>
        </header>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {leaderboardData.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center p-4 rounded-2xl backdrop-blur-md 
                  ${entry.isFriend 
                    ? "bg-primary/5 border border-primary/10 hover:bg-primary/10" 
                    : "bg-glass border border-glass-border hover:bg-white/5"
                  } transition-colors`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                    <AvatarImage src={entry.avatar} className="bg-white" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {entry.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-primary-foreground">{entry.name}</div>
                      {entry.isFriend && (
                        <div className="px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                          Friend
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-primary/60">
                      Last active {entry.lastActive}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-medium text-primary">
                      {entry.averageScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-primary/60">
                      {entry.totalSessions} sessions
                    </div>
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