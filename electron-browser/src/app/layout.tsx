"use client"

import type React from "react"

import { UserProvider } from "@/lib/userContext"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Athena Browser</title>
      </head>
      <body className="min-h-screen bg-[#0A0A0B] antialiased">
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  )
}

