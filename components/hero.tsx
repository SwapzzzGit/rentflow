"use client"

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center">
      {/* Badge */}
      <div
        className="animate-fade-up mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] px-4 py-1.5"
        style={{ animationDelay: "0ms" }}
      >
        <span className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-[#22C55E]" />
        <span className="text-xs text-[#999999]">Now live in US / UK / Australia</span>
      </div>

      {/* Headline */}
      <h1
        className="animate-fade-up font-serif font-extrabold leading-[1.05] tracking-[-0.03em] text-[#ffffff]"
        style={{
          fontSize: "clamp(48px, 7.5vw, 88px)",
          animationDelay: "120ms",
        }}
      >
        Your shortcut to
        <br />
        <span className="text-gradient-red">effortless</span> landlording.
      </h1>

      {/* Subheadline */}
      <p
        className="animate-fade-up mx-auto mt-6 max-w-[520px] text-lg leading-relaxed text-[#666666]"
        style={{ animationDelay: "240ms" }}
      >
        One app replaces five tools. Rent tracking, expenses,
        maintenance, and tenant communication — all for $9.99/month.
      </p>

      {/* CTA Row */}
      <div
        className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-4"
        style={{ animationDelay: "360ms" }}
      >
        <a
          href="#pricing"
          className="rounded-full bg-[#ffffff] px-8 py-3.5 text-base font-semibold text-[#080808] transition-colors hover:bg-[#e5e5e5]"
        >
          Start for Free
        </a>
        <a
          href="#features"
          className="px-6 py-3.5 text-base text-[#999999] transition-colors hover:text-[#ffffff]"
        >
          {"See how it works \u2192"}
        </a>
      </div>

      {/* Social Proof */}
      <div
        className="animate-fade-up mt-8 flex items-center justify-center gap-3"
        style={{ animationDelay: "480ms" }}
      >
        <div className="flex -space-x-2">
          {[
            { initials: "JK", bg: "#1D4ED8" },
            { initials: "SM", bg: "#7C3AED" },
            { initials: "PT", bg: "#059669" },
            { initials: "MR", bg: "#D97706" },
            { initials: "AL", bg: "#E8392A" },
          ].map((a) => (
            <div
              key={a.initials}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#080808] text-xs font-medium text-[#ffffff]"
              style={{ backgroundColor: a.bg }}
            >
              {a.initials}
            </div>
          ))}
        </div>
        <span className="text-sm text-[#666666]">Trusted by 2,400+ landlords</span>
      </div>
    </section>
  )
}
