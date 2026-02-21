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

        ctx.shadowColor = "rgba(232, 57, 42, 0.3)"
        ctx.shadowBlur = 40
        ctx.shadowOffsetY = 10

        const grad = ctx.createLinearGradient(-planeW / 2, -planeH / 2, planeW / 2, planeH / 2)
        grad.addColorStop(0, `rgba(232, 57, 42, ${0.6 + i * 0.06})`)
        grad.addColorStop(1, `rgba(255, 107, 85, ${0.4 + i * 0.06})`)

        ctx.fillStyle = grad
        ctx.beginPath()
        const r = 12
        ctx.roundRect(-planeW / 2, -planeH / 2, planeW, planeH, r)
        ctx.fill()

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
    <section className="px-6 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Label */}
        <div className="reveal-blur mb-4 text-center">
          <span className="inline-block text-xs uppercase tracking-widest text-[#E8392A]">
            Smart Automation
          </span>
        </div>

        {/* 3D Object with glow */}
        <div className="reveal-fade relative flex items-center justify-center overflow-hidden">
          {/* Radial glow behind canvas */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08] blur-3xl"
            style={{ background: "radial-gradient(ellipse, #E8392A, transparent)" }}
            aria-hidden="true"
          />
          <canvas
            ref={canvasRef}
            className="h-[280px] w-full max-w-[600px] md:h-[320px]"
            aria-hidden="true"
          />
        </div>

        {/* Text */}
        <div className="reveal-blur mx-auto max-w-3xl text-center">
          <h2
            className="font-serif font-extrabold tracking-[-0.025em] text-[#ffffff]"
            style={{ fontSize: "clamp(32px, 4vw, 54px)", lineHeight: "1.1" }}
          >
            Set it up once.
            <br />
            Let it run forever.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-[1.65] text-[#666666]">
            RentFlow sends the reminders, tracks the payments, and flags the issues. You just collect rent.
          </p>
        </div>

        {/* Columns */}
        <div className="mx-auto mt-10 grid max-w-5xl gap-8 md:grid-cols-4">
          {columns.map((col, idx) => (
            <div key={col.title} className={`reveal-blur stagger-${idx + 1} border-t border-[rgba(255,255,255,0.1)] pt-6`}>
              <h3 className="mb-2 text-sm font-semibold text-[#ffffff]">{col.title}</h3>
              <p className="text-sm leading-[1.65] text-[#666666]">{col.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
