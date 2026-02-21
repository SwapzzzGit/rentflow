"use client"

import { useEffect, useRef } from "react"

export function BuildSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener("resize", resize)

    const draw = () => {
      const w = canvas.getBoundingClientRect().width
      const h = canvas.getBoundingClientRect().height
      ctx.clearRect(0, 0, w, h)
      time += 0.006

      const centerX = w / 2
      const centerY = h / 2
      const size = Math.min(w, h) * 0.35

      // Draw two isometric-ish cards
      for (let j = 0; j < 2; j++) {
        ctx.save()
        ctx.translate(centerX + j * 15, centerY + j * 10)
        ctx.rotate(-0.15 + Math.sin(time * 0.4) * 0.03)

        // Skew for isometric look
        ctx.transform(1, -0.2, 0.3, 1, 0, 0)

        ctx.shadowColor = "rgba(59, 130, 246, 0.4)"
        ctx.shadowBlur = 50
        ctx.shadowOffsetY = 15

        const grad = ctx.createLinearGradient(-size / 2, -size * 0.35, size / 2, size * 0.35)
        grad.addColorStop(0, j === 0 ? "rgba(29, 78, 216, 0.7)" : "rgba(30, 64, 175, 0.5)")
        grad.addColorStop(1, j === 0 ? "rgba(59, 130, 246, 0.5)" : "rgba(29, 78, 216, 0.3)")
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(-size / 2, -size * 0.35, size, size * 0.7, 14)
        ctx.fill()

        ctx.strokeStyle = "rgba(59, 130, 246, 0.25)"
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.restore()
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <section className="px-6 py-24 md:py-32">
      <div className="reveal mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        {/* Left - Headline */}
        <div>
          <h2
            className="font-serif font-extrabold leading-[1.1] tracking-[-0.03em] text-[#ffffff]"
            style={{ fontSize: "clamp(40px, 5vw, 64px)" }}
          >
            Built for
            <br />
            landlords
            <br />
            who mean
            <br />
            business.
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[#666666]">
            Whether you have 1 property or 20, RentFlow scales with you. Multi-currency for US, UK, and Australia. Works on any device. No training needed.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <a href="#pricing" className="text-sm text-[#3B82F6] transition-colors hover:underline">
              {"\u2192 See pricing plans"}
            </a>
            <a href="#features" className="text-sm text-[#3B82F6] transition-colors hover:underline">
              {"\u2192 Multi-country features"}
            </a>
          </div>
        </div>

        {/* Right - Blue 3D Object */}
        <div className="flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            className="h-[300px] w-full md:h-[400px]"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  )
}
