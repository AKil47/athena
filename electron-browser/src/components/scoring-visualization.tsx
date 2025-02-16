import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";

interface ScoringVisualizationProps {
  scores: number[];
  onClose: () => void;
}

export default function ScoringVisualization({ scores, onClose }: ScoringVisualizationProps) {
  const getPathPoints = () => {
    return scores.map((score, i) => {
      const x = 100 + (i * 600) / Math.max(1, scores.length - 1);
      const normalizedScore = score - 8; 
      const y = 200 - (normalizedScore * 150); 
      return { x, y };
    });
  };

  const points = getPathPoints();
  
  // Create a smoother path for animation
  const createSmoothPath = () => {
    if (points.length < 2) return '';
    
    return points.reduce((path, point, i) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      
      // Calculate control points for smooth curve
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
    const x = 100 + (i * 600) / 20;
    const y = 200 + Math.sin(i * 0.5) * 5;
    baselinePoints.push({ x, y });
  }
  const baselineD = `M ${baselinePoints.map(p => `${p.x},${p.y}`).join(' L ')}`;

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.electron) {
      console.warn('closeWindow method does not exist on window.electron');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background p-8 rounded-3xl border border-border w-[800px]"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Your Focus Journey</h2>
          
          <div className="relative w-full h-[400px]">
            <svg width="800" height="400" className="w-full">
              {/* Grid lines */}
              {[...Array(11)].map((_, i) => (
                <line
                  key={`grid-${i}`}
                  x1="100"
                  y1={50 + i * 30}
                  x2="700"
                  y2={50 + i * 30}
                  stroke="rgba(255,255,255,0.1)"
                  strokeDasharray="4 4"
                />
              ))}
              
              {/* Score labels */}
              {[10, 9, 8, 7, 6, 5, 4].map((score, i) => (
                <text
                  key={`score-${score}`}
                  x="70"
                  y={50 + i * 50}
                  textAnchor="end"
                  className="text-xs fill-muted-foreground"
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
                    r="6"
                    fill="url(#gradient)"
                  />
                  <text
                    x={point.x}
                    y={point.y - 15}
                    textAnchor="middle"
                    className="text-sm fill-current"
                  >
                    {scores[i].toFixed(1)}
                  </text>
                </motion.g>
              ))}
              
              {/* Animated character */}
              <motion.g
                style={{
                  offsetPath: `path("${pathD}")`,
                  offsetRotate: "0deg"
                }}
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{
                  duration: 2,
                  delay: 0.5,
                  ease: "linear"
                }}
              >
                <circle r="10" fill="url(#gradient)" />
                <path
                  d="M-4,-2 Q0,-4 4,-2 M-3,2 Q0,4 3,2"
                  stroke="white"
                  strokeWidth="1.5"
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
              onClick={handleClose}
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