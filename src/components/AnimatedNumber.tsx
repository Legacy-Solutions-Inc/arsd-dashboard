"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  duration?: number;
}

export function AnimatedNumber({ value, suffix = "", duration = 2 }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, {
        duration,
        ease: "easeOut",
        onUpdate: (latest) => {
          if (ref.current) {
            ref.current.textContent = Math.round(latest) + suffix;
          }
        },
      });
      return controls.stop;
    }
  }, [isInView, motionValue, value, suffix, duration]);

  return (
    <span ref={ref} className="font-display">
      0{suffix}
    </span>
  );
}
