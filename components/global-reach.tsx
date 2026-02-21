"use client"

import { useEffect, useRef } from "react"

const currencies = [
  { flag: "\uD83C\uDDFA\uD83C\uDDF8", label: "USD" },
  { flag: "\uD83C\uDDEC\uD83C\uDDE7", label: "GBP" },
  { flag: "\uD83C\uDDE6\uD83C\uDDFA", label: "AUD" },
  { flag: "\uD83C\uDDE8\uD83C\uDDE6", label: "CAD" },
  { flag: "\uD83C\uDDEA\uD83C\uDDFA", label: "EUR" },
  { flag: "\uD83C\uDDEE\uD83C\uDDF3", label: "INR" },
  { flag: "\uD83C\uDDE6\uD83C\uDDEA", label: "AED" },
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

      const faces = [
        { points: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], fill: "rgba(15, 23, 42, 0.6)" },
        { points: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], fill: "rgba(30, 58, 138, 0.4)" },
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
    <section className="px-6 py-20 md:py-24">
      <div className="reveal-blur mx-auto max-w-4xl text-center">
        <span className="mb-4 inline-block text-xs uppercase tracking-widest text-[#3B82F6]">
          Global Reach
        </span>
        <h2
          className="font-serif font-extrabold tracking-[-0.025em] text-[#ffffff]"
          style={{ fontSize: "clamp(32px, 4vw, 54px)", lineHeight: "1.1" }}
        >
          One app. Every country.
          <br />
          Zero complexity.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-[1.65] text-[#666666]">
          Auto-detects your currency and date format. Supports 20+ currencies including USD, GBP, AUD, CAD, EUR, INR, AED, SGD and more. Works wherever you own property.
        </p>
      </div>

      <div className="reveal-fade relative mx-auto flex items-center justify-center overflow-hidden">
        {/* Blue radial glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.1), transparent)" }}
          aria-hidden="true"
        />
        <canvas
          ref={canvasRef}
          className="h-[220px] w-full max-w-[500px] md:h-[300px]"
          aria-hidden="true"
        />
      </div>

      <div className="reveal-blur flex flex-wrap items-center justify-center gap-3">
        {currencies.map((c) => (
          <span
            key={c.label}
            className="rounded-full border border-[rgba(255,255,255,0.1)] px-4 py-2 text-sm text-[#999999]"
          >
            {c.flag} {c.label}
          </span>
        ))}
        <span className="rounded-full border border-[rgba(255,255,255,0.07)] px-4 py-2 text-sm text-[#555555]">
          + 14 more
        </span>
      </div>
    </section>
  )
}
