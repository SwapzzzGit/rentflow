"use client"

import { useEffect, useRef } from "react"

const countries = [
  { flag: "\uD83C\uDDFA\uD83C\uDDF8", name: "United States", currency: "USD" },
  { flag: "\uD83C\uDDEC\uD83C\uDDE7", name: "United Kingdom", currency: "GBP" },
  { flag: "\uD83C\uDDE6\uD83C\uDDFA", name: "Australia", currency: "AUD" },
]

export function GlobalReach() {
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
      time += 0.005

      const centerX = w / 2
      const centerY = h / 2
      const cubeSize = Math.min(w, h) * 0.22

      ctx.save()
      ctx.translate(centerX, centerY)

      const angle = time * 0.3

      // Draw wireframe-style cube faces
      const faces = [
        // Front
        { points: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], fill: "rgba(15, 23, 42, 0.6)" },
        // Top
        { points: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], fill: "rgba(30, 58, 138, 0.4)" },
        // Right
        { points: [[1, -1, -1], [1, -1, 1], [1, 1, 1], [1, 1, -1]], fill: "rgba(29, 78, 216, 0.3)" },
      ]

      const project = (x: number, y: number, z: number) => {
        const cosA = Math.cos(angle)
        const sinA = Math.sin(angle)
        const rx = x * cosA - z * sinA
        const rz = x * sinA + z * cosA

        const cosB = Math.cos(0.5)
        const sinB = Math.sin(0.5)
        const ry = y * cosB - rz * sinB

        return { px: rx * cubeSize, py: ry * cubeSize }
      }

      faces.forEach((face) => {
        const projected = face.points.map(([x, y, z]) => project(x, y, z))

        ctx.beginPath()
        projected.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.px, p.py)
          else ctx.lineTo(p.px, p.py)
        })
        ctx.closePath()
        ctx.fillStyle = face.fill
        ctx.fill()
        ctx.strokeStyle = "rgba(59, 130, 246, 0.35)"
        ctx.lineWidth = 1.5
        ctx.stroke()
      })

      // Glow
      ctx.shadowColor = "rgba(59, 130, 246, 0.5)"
      ctx.shadowBlur = 80

      ctx.restore()

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
      <div className="reveal mx-auto max-w-4xl text-center">
        <span className="mb-4 inline-block text-xs uppercase tracking-widest text-[#3B82F6]">
          Global Reach
        </span>
        <h2
          className="font-serif font-extrabold tracking-[-0.03em] text-[#ffffff]"
          style={{ fontSize: "clamp(32px, 4vw, 54px)" }}
        >
          One app. Three countries.
          <br />
          Zero complexity.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[#666666]">
          Auto-detects your currency and date format. Switch between USD, GBP, and AUD in settings.
        </p>
      </div>

      <div className="mx-auto flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          className="h-[250px] w-full max-w-[500px] md:h-[350px]"
          aria-hidden="true"
        />
      </div>

      <div className="reveal flex flex-wrap items-center justify-center gap-4">
        {countries.map((c) => (
          <span
            key={c.currency}
            className="rounded-full border border-[rgba(255,255,255,0.1)] px-4 py-2 text-sm text-[#999999]"
          >
            {c.flag} {c.name} ({c.currency})
          </span>
        ))}
      </div>
    </section>
  )
}
