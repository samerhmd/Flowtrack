'use client';

import { useState, useEffect } from 'react';

interface SessionTimerProps {
  startTime: Date;
}

export default function SessionTimer({ startTime }: SessionTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      setElapsedMs(Date.now() - startTime.getTime());
    };

    // Update immediately
    updateTimer();
    
    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <p className="text-2xl font-mono">{formatted}</p>
  );
}