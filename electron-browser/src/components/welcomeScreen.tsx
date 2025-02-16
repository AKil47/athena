"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/lib/userContext"

export default function WelcomeScreen() {
  const [name, setName] = useState("")
  const [goal, setGoal] = useState("")
  const { setUser } = useUser()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setUser(name, goal)
    } catch (error) {
      console.error("Error in setUser:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="glass p-8 rounded-3xl shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Welcome to Athena
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground/80">
              What's your name?
            </label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-xl bg-white/5 border-white/10 focus:bg-white/10 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="goal" className="text-sm font-medium text-foreground/80">
              What's your goal?
            </label>
            <Input
              id="goal"
              placeholder="Enter your goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
              className="rounded-xl bg-white/5 border-white/10 focus:bg-white/10 transition-colors"
            />
          </div>
          <Button type="submit" className="w-full rounded-xl bg-primary hover:bg-primary/90 transition-colors">
            Get Started
          </Button>
        </form>
      </div>
    </div>
  )
}

