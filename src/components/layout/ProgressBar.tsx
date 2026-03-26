import { useState, useEffect } from "react";

interface ProgressBarProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Reading progress bar — a thin accent-coloured line at the very top of the window.
 * Fills from 0% (top of document) to 100% (bottom).
 *
 * Uses a passive scroll listener for performance — passive: true tells the browser
 * we will not call preventDefault(), allowing it to scroll without waiting for us.
 */
export function ProgressBar({ scrollContainerRef }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);
    };

    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, [scrollContainerRef]);

  return (
    <div
      className="progress-bar"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
    </div>
  );
}
