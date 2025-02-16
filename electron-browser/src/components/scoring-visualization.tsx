import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";

interface ScoringVisualizationProps {
  scores: number[];
  onClose: () => void;
}

interface ElectronWindow {
  electron?: {
    closeWindow?: () => void;
    [key: string]: any;
  };
}

declare const window: ElectronWindow;

export default function ScoringVisualization({ scores, onClose }: ScoringVisualizationProps) {
  // Increased dimensions for larger graph
  const width = 1200;
  const height = 600;
  const padding = 100;
  const graphWidth = width - (padding * 2);
  
  const getPathPoints = () => {
    return scores.map((score, i) => {
      const x = padding + (i * graphWidth) / Math.max(1, scores.length - 1);
      const normalizedScore = score - 8; 
      const y = (height / 2) - (normalizedScore * 200); // Increased scale factor
      return { x, y };
    });
  };

  const points = getPathPoints();
  
  // Create a smoother path for display
  const createSmoothPath = () => {
    if (points.length < 2) return '';
    
    return points.reduce((path, point, i) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      
      const prevPoint = points[i - 1];
      const cp1x = prevPoint.x + (point.x - prevPoint.x) / 3;
      const cp1y = prevPoint.y;
      const cp2x = point.x - (point.x - prevPoint.x) / 3;
      const cp2y = point.y;
      
      return `${path} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
    }, '');
  };

  const pathD = createSmoothPath();

  // Generate curve for baseline (8/10)
  const baselinePoints = [];
  for (let i = 0; i <= 20; i++) {
    const x = padding + (i * graphWidth) / 20;
    const y = height / 2 + Math.sin(i * 0.5) * 5;
    baselinePoints.push({ x, y });
  }
  const baselineD = `M ${baselinePoints.map(p => `${p.x},${p.y}`).join(' L ')}`;

  // Generate animation points with interpolation
  const generateAnimationPoints = () => {
    if (points.length < 2) return [points[0]];
    
    const animationPoints = [];
    const steps = 50;
    
    for (let i = 0; points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      for (let step = 0; step < steps; step++) {
        const progress = step / steps;
        const x = current.x + (next.x - current.x) * progress;
        const y = current.y + (next.y - current.y) * progress;
        animationPoints.push({ x, y });
      }
    }
    
    animationPoints.push(points[points.length - 1]);
    return animationPoints;
  };

  const animationPoints = generateAnimationPoints();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background p-8 rounded-3xl border border-border w-[1400px]"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Your Focus Journey</h2>
          
          <div className="relative w-full h-[600px]">
            <svg width={width} height={height} className="w-full">
              {/* Grid lines */}
              {[...Array(11)].map((_, i) => (
                <line
                  key={`grid-${i}`}
                  x1={padding}
                  y1={50 + i * 50}
                  x2={width - padding}
                  y2={50 + i * 50}
                  stroke="rgba(255,255,255,0.1)"
                  strokeDasharray="4 4"
                />
              ))}
              
              {/* Score labels */}
              {[10, 9, 8, 7, 6, 5, 4].map((score, i) => (
                <text
                  key={`score-${score}`}
                  x={padding - 20}
                  y={50 + i * 80}
                  textAnchor="end"
                  className="text-sm fill-muted-foreground"
                >
                  {score}/10
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
                transition={{ duration: 2, delay: 0.5 }}
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
                  transition={{ delay: 2 + (i * 0.1) }}
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="8"
                    fill="url(#gradient)"
                  />
                  <text
                    x={point.x}
                    y={point.y - 20}
                    textAnchor="middle"
                    className="text-sm fill-current"
                  >
                    {scores[i].toFixed(1)}
                  </text>
                </motion.g>
              ))}
              
              {/* Animated character */}
              <motion.g
                initial={{ x: animationPoints[0]?.x || 0, y: animationPoints[0]?.y || 0 }}
                animate={{
                  x: animationPoints.map(p => p.x),
                  y: animationPoints.map(p => p.y)
                }}
                transition={{
                  duration: 2,
                  delay: 0.5,
                  ease: "linear",
                  times: animationPoints.map((_, i) => i / (animationPoints.length - 1))
                }}
              >
                <circle r="12" fill="url(#gradient)" />
                <path
                  d="M-5,-2 Q0,-5 5,-2 M-4,2 Q0,5 4,2"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
              </motion.g>
            </svg>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-muted-foreground mb-4">
              Average focus score: {(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}/10
              {scores.length > 0 && (
                <span className="ml-2">
                  ({(scores.reduce((a, b) => a + b, 0) / scores.length - 8).toFixed(1)} points from baseline)
                </span>
              )}
            </p>
            <Button 
              onClick={() => {
                // First try to close through Electron
                if (window.electron?.closeWindow) {
                  window.electron.closeWindow();
                } else {
                  console.warn("window.electron is not defined or closeWindow method does not exist");
                  // Call the onClose callback
                  onClose();
                }
              }}
              className="rounded-xl"
            >
              Close Browser
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}