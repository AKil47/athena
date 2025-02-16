'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type UserContextType = {
  userName: string
  userGoal: string
  setUser: (name: string, goal: string) => void
  isAuthenticated: boolean
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from localStorage if available
  const [userName, setUserName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userName') || ''
    }
    return ''
  })
  
  const [userGoal, setUserGoal] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userGoal') || ''
    }
    return ''
  })
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isAuthenticated') === 'true'
    }
    return false
  })
  
  const router = useRouter()

  // Update localStorage when state changes
  useEffect(() => {
    if (userName) localStorage.setItem('userName', userName)
    if (userGoal) localStorage.setItem('userGoal', userGoal)
    localStorage.setItem('isAuthenticated', isAuthenticated.toString())
  }, [userName, userGoal, isAuthenticated])

  const setUser = (name: string, goal: string) => {
    console.log('Setting user:', name, goal)
    setUserName(name)
    setUserGoal(goal)
    setIsAuthenticated(true)
    try {
      router.push('/browser')
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }

  return (
    <UserContext.Provider value={{ userName, userGoal, setUser, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  
  return context
}