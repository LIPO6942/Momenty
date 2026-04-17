"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ParallaxContainerProps {
  children: React.ReactNode;
  speed?: number; // Adjust for more/less movement
  className?: string;
  active?: boolean;
}

export const ParallaxContainer = ({
  children,
  speed = 0.04,
  className,
  active = true,
}: ParallaxContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!active) {
      setOffset(0);
      return;
    }

    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Only calculate if the element is visible
      if (rect.top < viewportHeight && rect.bottom > 0) {
        // Distance from the center of the viewport
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = viewportHeight / 2;
        const diff = elementCenter - viewportCenter;
        
        // Update offset based on distance from center and speed
        setOffset(diff * speed);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial call to set position
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed, active]);

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden relative", className)}
    >
      <div
        style={{
          // stronger Ken Burns: larger scale and subtle horizontal move based on scroll offset
          transform: `scale(1.3) translate(${Math.max(Math.min(offset * 0.35, 20), -20)}px, ${offset}px)`,
        }}
        className="h-full w-full transition-transform duration-150 ease-out will-change-transform"
      >
        {children}
      </div>
    </div>
  );
};
