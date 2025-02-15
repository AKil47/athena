"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface WelcomeScreenProps {
  onComplete: (name: string, goal: string) => void
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [name, setName] = useState("")
  const [goal, setGoal] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', { name, goal })
    onComplete(name, goal)
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur flex items-center justify-center">
      <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Welcome to Athena</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              What's your name?
            </label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
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