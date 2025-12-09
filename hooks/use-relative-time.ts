import { useEffect, useState } from 'react';

/**
 * Hook to format and update relative time in real-time
 * Updates every minute for recent posts, less frequently for older ones
 */
export function useRelativeTime(dateString: string): string {
  const [relativeTime, setRelativeTime] = useState(() => formatRelativeDate(dateString));

  useEffect(() => {
    const updateTime = () => {
      setRelativeTime(formatRelativeDate(dateString));
    };

    updateTime();

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let interval: ReturnType<typeof setInterval> | null = null;

    if (diffMins < 60) {
      interval = setInterval(updateTime, 60000);
    } else if (diffHours < 24) {
      interval = setInterval(updateTime, 3600000);
    } else if (diffDays < 7) {
      interval = setInterval(updateTime, 86400000);
    } else {
      return;
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [dateString]);

  return relativeTime;
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

