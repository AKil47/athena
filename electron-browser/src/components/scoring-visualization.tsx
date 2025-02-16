"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"


interface ScoringVisualizationProps {
  scores: number[]
  onClose: () => void
}

interface ScoringVisualizationProps {
  scores: number[]
  onClose: () => void
}

export default function ScoringVisualization({ scores, onClose }: ScoringVisualizationProps) {
  const width = 1200
  const height = 600
  const padding = 100
  const graphWidth = width - padding * 2

  // Normalize scores to be relative to baseline of 8
  const normalizedScores = scores.map((score) => score)

  const getPathPoints = () => {
    return normalizedScores.map((score, i) => {
      const x = padding + (i * graphWidth) / Math.max(1, scores.length - 1)
      const y = height - (padding + (score * (height - padding * 2)) / 10)
      return { x, y }
    })
  }

  const handleClose = useCallback(async () => {
    try {
      onClose()
    } catch (error) {
      console.error('Error in handleClose:', error)
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    const hideBrowserView = async () => {
      if (window.electron) {
        try {
          // Hide the browser view immediately when component mounts
          await window.electron.resizeBrowserView({
            x: 0,
            y: 0,
            width: 0,
            height: 0
          })
        } catch (error) {
          console.error('Error hiding browser view:', error)
        }
      }
    }

    hideBrowserView()

    // No cleanup needed since the window will be closed
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [handleClose])



  useEffect(() => {
    console.log("ScoringVisualization mounted with scores:", scores)
  }, [scores])


  const points = getPathPoints()

  const createSmoothPath = () => {
    if (points.length < 2) return ""

    return points.reduce((path, point, i) => {
      if (i === 0) return `M ${point.x},${point.y}`

      const prevPoint = points[i - 1]
      const cp1x = prevPoint.x + (point.x - prevPoint.x) / 3
      const cp1y = prevPoint.y
      const cp2x = point.x - (point.x - prevPoint.x) / 3
      const cp2y = point.y

      return `${path} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`
    }, "")
  }

  const pathD = createSmoothPath()

  // Generate baseline at score 8
  const baselineY = height - (padding + (8 * (height - padding * 2)) / 10)
  const baselineD = `M ${padding},${baselineY} L ${width - padding},${baselineY}`

  // Generate animation points with interpolation
  const generateAnimationPoints = () => {
    if (points.length < 2) return [points[0]]

    const animationPoints = []
    const steps = 50

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]

      for (let step = 0; step < steps; step++) {
        const progress = step / steps
        const x = current.x + (next.x - current.x) * progress
        const y = current.y + (next.y - current.y) * progress
        animationPoints.push({ x, y })
      }
    }

    animationPoints.push(points[points.length - 1])
    return animationPoints
  }

  const animationPoints = generateAnimationPoints()


  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] 
  flex items-center justify-center 
  bg-indigo-950
  transition-opacity duration-300"
        onClick={(e) => {
          console.log("Clicked container, target:", e.target)
          console.log("Current target:", e.currentTarget)
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background p-8 rounded-3xl border border-border w-[1400px]"
          onClick={(e) => {
            console.log("Clicked motion.div")
            e.stopPropagation()
          }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Your Focus Scores for today!</h2>

          <div className="relative w-full h-[600px]">
            <svg width={width} height={height} className="w-full">
              {/* Grid lines */}
              {[...Array(11)].map((_, i) => (
                <line
                  key={`grid-${i}`}
                  x1={padding}
                  y1={padding + (i * (height - padding * 2)) / 10}
                  x2={width - padding}
                  y2={padding + (i * (height - padding * 2)) / 10}
                  stroke="rgba(255,255,255,0.1)"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Score labels */}
              {[...Array(11)].map((_, i) => (
                <text
                  key={`score-${10 - i}`}
                  x={padding - 10}
                  y={padding + (i * (height - padding * 2)) / 10}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="text-sm fill-muted-foreground"
                >
                  {10 - i}
                </text>
              ))}

              {/* Baseline path (8/10) */}
              <motion.path
                d={baselineD}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
                strokeDasharray="5,5"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />

              {/* Actual path */}
              <motion.path
                d={pathD}
                stroke="url(#gradient)"
                strokeWidth="3"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 10, delay: 0.5 }}
              />

              {/* Gradient definition */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>

              {/* Score points with labels */}
              {points.map((point, i) => (
                <motion.g
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2 + i * 0.1 }}
                >
                  <circle cx={point.x} cy={point.y} r="6" fill="url(#gradient)" />
                  <text x={point.x} y={point.y - 15} textAnchor="middle" className="text-sm fill-current">
                    {scores[i].toFixed(1)}
                  </text>
                </motion.g>
              ))}

              {/* Animated character */}
              <motion.g
                initial={{ x: points[0].x, y: points[0].y }}
                animate={{
                  x: animationPoints.map((p) => p.x),
                  y: animationPoints.map((p) => p.y),
                }}
                transition={{
                  duration: 10,
                  delay: 0.5,
                  ease: "linear",
                  times: animationPoints.map((_, i) => i / (animationPoints.length - 1)),
                }}
              >
                <image href="/kiki-removebg1.png" width="192" height="192" x="-24" y="-140" className="rounded-full" />
              </motion.g>
            </svg>
          </div>

          <div className="text-center mt-6 relative z-[100]">
            <p className="text-muted-foreground mb-4">
              Average focus score: {(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}/10
              {scores.length > 0 && (
                <span className="ml-2">
                  ({(scores.reduce((a, b) => a + b, 0) / scores.length - 8).toFixed(1)} points from baseline)
                </span>
              )}
            </p>
            <Button
              onClick={(e) => {
                console.log("Button clicked")
                e.stopPropagation()
                handleClose()
              }}
              className="rounded-xl relative z-[100]"
            >
              Close Browser
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}