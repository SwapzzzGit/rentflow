"use client"

import { useEffect, useRef } from "react"

export function BackgroundCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create CSS-based animated beams as fallback (lighter than Three.js)
    const beams = [
      { x: "10%", y: "20%", size: 600, color: "#E8392A", delay: 0, duration: 18 },
      { x: "70%", y: "10%", size: 500, color: "#FF6B55", delay: 2, duration: 22 },
      { x: "40%", y: "50%", size: 700, color: "#E8392A", delay: 4, duration: 20 },
      { x: "80%", y: "60%", size: 450, color: "#FF6B55", delay: 1, duration: 25 },
      { x: "20%", y: "80%", size: 550, color: "#E8392A", delay: 3, duration: 19 },
    ]

    const elements: HTMLDivElement[] = []

    beams.forEach((beam) => {
      const el = document.createElement("div")
      el.style.cssText = `
        position: absolute;
        left: ${beam.x};
        top: ${beam.y};
        width: ${beam.size}px;
        height: ${beam.size}px;
        background: radial-gradient(ellipse at center, ${beam.color} 0%, transparent 70%);
        opacity: 0.12;
        filter: blur(120px);
        transform: rotate(45deg);
        animation: beamDrift${elements.length} ${beam.duration}s ease-in-out infinite alternate;
        animation-delay: ${beam.delay}s;
        pointer-events: none;
      `
      container.appendChild(el)
      elements.push(el)
    })

    // Add keyframe styles
    const style = document.createElement("style")
    style.textContent = elements
      .map(
        (_, i) => `
        @keyframes beamDrift${i} {
          0% { transform: rotate(45deg) translate(0, 0); }
          100% { transform: rotate(45deg) translate(${30 + i * 10}px, ${-20 + i * 8}px); }
        }
      `
      )
      .join("")
    document.head.appendChild(style)

    return () => {
      elements.forEach((el) => el.remove())
      style.remove()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    />
  )
}
