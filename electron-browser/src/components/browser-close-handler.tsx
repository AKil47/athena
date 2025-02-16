import React, { useState, useEffect } from 'react';
import ScoringVisualization from './scoring-visualization';

export default function BrowserCloseHandler() {
  const [showVisualization, setShowVisualization] = useState(false);
  const [scores, setScores] = useState<number[]>([]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Prevent the default close behavior
      e.preventDefault();
      e.returnValue = '';

      // Get all relevancy scores from tabs
      const tabScores = Array.from(
        document.querySelectorAll('[data-relevancy-score]')
      ).map((el) => Number(el.getAttribute('data-relevancy-score') || '0'));

      setScores(tabScores);
      setShowVisualization(true);

      return false;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  if (!showVisualization) return null;

  return (
    <ScoringVisualization
      scores={scores}
      onClose={() => {
        setShowVisualization(false);
        window.close();
      }}
    />
  );
}