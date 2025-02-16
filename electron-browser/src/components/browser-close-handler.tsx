"use client"

import { useState, useEffect } from "react"
import ScoringVisualization from "./scoring-visualization"

interface ElectronWindow {
  electron?: {
    closeWindow?: () => Promise<{ success: boolean; error?: string }>
    [key: string]: any
  };
}

declare const window: ElectronWindow

export default function BrowserCloseHandler() {
  const [showVisualization, setShowVisualization] = useState(false)
  const [scores, setScores] = useState<number[]>([])
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    console.log("BrowserCloseHandler mounted")
    return () => console.log("BrowserCloseHandler unmounted")
  }, [])

  useEffect(() => {
    console.log("showVisualization changed:", showVisualization)
  }, [showVisualization])

  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent & Event) => {
      console.log("BeforeUnload event triggered")
      if (isClosing) {
        console.log("Already closing, skipping")
        return
      }

      e.preventDefault()
      e.returnValue = ""

      // Get scores from tabs
      const tabScores = Array.from(document.querySelectorAll("[data-relevancy-score]")).map((el) =>
        Number.parseFloat(el.getAttribute("data-relevancy-score") || "0"),
      )

      if (tabScores.length > 0) {
        console.log("Setting scores and showing visualization")
        setScores(tabScores)
        setShowVisualization(true)
        return false
      } else {
        console.log("No scores found, attempting to close immediately")
        setIsClosing(true)
        if (window.electron?.closeWindow) {
          try {
            const result = await window.electron.closeWindow()
            console.log("Close window result:", result)
          } catch (error) {
            console.error("Failed to close window:", error)
            setIsClosing(false)
          }
        } else {
          console.warn("window.electron.closeWindow not available")
        }
      }
    }

    console.log("Adding beforeunload event listener");
    (window as Window).addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      console.log("Removing beforeunload event listener");
      (window as Window).removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isClosing])

  const handleClose = async () => {
    console.log("handleClose called in BrowserCloseHandler")
    if (isClosing) {
      console.log("Already closing, skipping handleClose")
      return
    }

    console.log("Setting isClosing to true")
    setIsClosing(true)
    console.log("Setting showVisualization to false")
    setShowVisualization(false)

    if (window.electron?.closeWindow) {
      try {
        console.log("Calling window.electron.closeWindow")
        const result = await window.electron.closeWindow()
        console.log("Close window result:", result)
        if (!result.success) {
          console.error("Failed to close window:", result.error)
          setIsClosing(false)
        }
      } catch (error) {
        console.error("Error closing window:", error)
        setIsClosing(false)
      }
    } else {
      console.warn("window.electron.closeWindow not available")
    }
  }

  if (!showVisualization) {
    console.log("Not showing visualization, returning null")
    return null
  }

  console.log("Rendering ScoringVisualization with scores:", scores)
  return <ScoringVisualization scores={scores} onClose={handleClose} />
}