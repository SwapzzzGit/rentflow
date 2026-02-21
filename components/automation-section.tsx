"use client"

import { useEffect, useRef } from "react"

const columns = [
  {
    title: "Auto rent reminders",
    body: "3 days before due, on the day, and 3 days after — tenants get push + email.",
  },
  {
    title: "Lease expiry alerts",
    body: "60 and 30 day warnings before any lease ends. Never miss a renewal window.",
  },
  {
    title: "Monthly summaries",
    body: "Email digest every 1st: income received, expenses logged, open issues.",
  },
  {
    title: "Overdue escalation",
    body: "Auto-escalate overdue rent from reminder to formal notice template.",
  },
]

export function AutomationSection() {
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
      time += 0.008

      const centerX = w / 2
      const centerY = h / 2
      const planeW = Math.min(w * 0.35, 220)
      const planeH = planeW * 0.6
      const numPlanes = 6

      for (let i = 0; i < numPlanes; i++) {
        const offset = (i - numPlanes / 2) * 18
        const yOff = offset * 0.8 + Math.sin(time + i * 0.3) * 4
        const xOff = offset * 1.2

        ctx.save()
        ctx.translate(centerX + xOff, centerY + yOff)
        ctx.rotate(-0.3 + Math.sin(time * 0.5 + i * 0.2) * 0.02)

        // Shadow
        ctx.shadowColor = "rgba(232, 57, 42, 0.3)"
        ctx.shadowBlur = 40
        ctx.shadowOffsetY = 10

        // Plane with gradient
        const grad = ctx.createLinearGradient(-planeW / 2, -planeH / 2, planeW / 2, planeH / 2)
        grad.addColorStop(0, `rgba(232, 57, 42, ${0.6 + i * 0.06})`)
        grad.addColorStop(1, `rgba(255, 107, 85, ${0.4 + i * 0.06})`)

        ctx.fillStyle = grad
        ctx.beginPath()
        const r = 12
        ctx.roundRect(-planeW / 2, -planeH / 2, planeW, planeH, r)
        ctx.fill()

        // Edge highlight
        ctx.strokeStyle = `rgba(255, 140, 122, ${0.15 + i * 0.03})`
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
      <div className="mx-auto max-w-6xl">
        {/* 3D Object */}
        <div className="reveal mb-16 flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            className="h-[350px] w-full max-w-[600px] md:h-[450px]"
            aria-hidden="true"
          />
        </div>

        {/* Text */}
        <div className="reveal mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-block text-xs uppercase tracking-widest text-[#E8392A]">
            Smart Automation
          </span>
          <h2
            className="font-serif font-extrabold tracking-[-0.03em] text-[#ffffff]"
            style={{ fontSize: "clamp(32px, 4vw, 54px)" }}
          >
            Set it up once.
            <br />
            Let it run forever.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[#666666]">
            RentFlow sends the reminders, tracks the payments, and flags the issues. You just collect rent.
          </p>
        </div>

        {/* Columns */}
        <div className="reveal mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title} className="border-t border-[rgba(255,255,255,0.1)] pt-6">
              <h3 className="mb-2 text-sm font-semibold text-[#ffffff]">{col.title}</h3>
              <p className="text-sm leading-relaxed text-[#666666]">{col.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
