'use client'

import BrowserWindow from "@/components/browser"
import { UserProvider } from "@/lib/userContext"

export default function BrowserPage() {
  return (
    <UserProvider>
      <BrowserWindow />
    </UserProvider>
  )
}
