"use client"

import { useEffect } from "react"
import Script from "next/script"

export function ScrollRevealInit() {
  useEffect(() => {
    // Intersection Observer for blur-reveal elements
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed")
          }
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    )

    const elements = document.querySelectorAll(".reveal-blur, .reveal-fade")
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // Initialize Lenis once the script has loaded
    const initLenis = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Lenis = (window as any).Lenis
      if (!Lenis) return

      const lenis = new Lenis({
        duration: 1.4,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
      })

      function raf(time: number) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)

      return () => lenis.destroy()
    }

    // Check if already loaded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Lenis) {
      initLenis()
    } else {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).Lenis) {
          clearInterval(checkInterval)
          initLenis()
        }
      }, 100)

      return () => clearInterval(checkInterval)
    }
  }, [])

  return (
    <Script
      src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"
      strategy="afterInteractive"
    />
  )
}
