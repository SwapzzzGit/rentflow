'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, PartyPopper } from 'lucide-react'

export function StepDone({
  landlordName,
  summary,
  onGo,
  onAddAnother,
}: {
  landlordName: string
  summary: string[]
  onGo: () => void
  onAddAnother: () => void
}) {
  const firstName = landlordName.split(' ')[0] || 'there'
  const [visibleCount, setVisibleCount] = useState(0)

  // Stagger each summary item in with 180ms intervals
  useEffect(() => {
    if (visibleCount < summary.length) {
      const t = setTimeout(() => setVisibleCount((n) => n + 1), 180)
      return () => clearTimeout(t)
    }
  }, [visibleCount, summary.length])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 text-center">
      {/* Success icon */}
      <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
        <PartyPopper className="w-7 h-7 text-emerald-500" />
      </div>

      <h2
        className="text-2xl font-bold text-slate-900 mb-2"
        style={{ fontFamily: 'var(--font-bricolage, sans-serif)' }}
      >
        You're all set, {firstName}!
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Here's what we set up for you:
      </p>

      {/* Staggered summary list */}
      <ul className="text-left space-y-2 mb-8">
        {summary.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 transition-all duration-300"
            style={{
              opacity: i < visibleCount ? 1 : 0,
              transform: i < visibleCount ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-700">{item}</span>
          </li>
        ))}
      </ul>

      {/* CTAs */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onGo}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150"
          style={{ background: '#0f172a' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#0f172a' }}
        >
          Go to my dashboard →
        </button>
        <button
          type="button"
          onClick={onAddAnother}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all duration-150"
        >
          Add another property
        </button>
      </div>
    </div>
  )
}
