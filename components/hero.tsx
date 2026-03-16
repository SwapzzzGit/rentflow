"use client"

import { GeoConfig, getGeoConfig } from "@/lib/geo"
 
export function Hero({ geoConfig = getGeoConfig(null) }: { geoConfig?: GeoConfig }) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center">
      {/* Tax Urgency Badge */}
      {geoConfig.tax_urgency && (
        <span className="animate-fade-up inline-block text-[10px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-full bg-red-100/10 text-red-500 border border-red-500/20 mb-6" style={{ animationDelay: "100ms" }}>
          {geoConfig.tax_urgency}
        </span>
      )}
 
      {/* Badge */}
      <div
        className="animate-fade-up mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] px-4 py-1.5"
        style={{ animationDelay: "200ms" }}
      >
        <span className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-[#22C55E]" />
        <span className="text-xs text-[#999999]">Trusted by landlords in 30+ countries</span>
      </div>
 
      {/* Headline */}
      <h1
        className="animate-fade-up font-serif font-extrabold text-[#ffffff]"
        style={{
          fontSize: "clamp(32px, 7vw, 76px)",
          lineHeight: "1.05",
          letterSpacing: "-0.035em",
          animationDelay: "320ms",
        }}
      >
        {geoConfig.hero_headline.split(' ').map((word, i) => (
          <span key={i}>
            {['MTD-ready', 'ATO', 'audit-ready', 'effortless'].some(val => word.toLowerCase().includes(val.toLowerCase())) ? (
              <span className="text-gradient-red">{word}</span>
            ) : (
              word
            )}
            {' '}
          </span>
        ))}
      </h1>
 
      {/* Subheadline */}
      <p
        className="animate-fade-up mx-auto mt-6 max-w-[620px] text-lg leading-[1.65] text-[#666666]"
        style={{ animationDelay: "440ms" }}
      >
        {geoConfig.hero_subheadline}
      </p>

      {/* CTA Row */}
      <div
        className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-4"
        style={{ animationDelay: "560ms" }}
      >
        <div className="flex flex-col items-center gap-2">
          <a
            href="#pricing"
            className="rounded-full bg-[#ffffff] px-8 py-3.5 text-base font-semibold text-[#080808] transition-colors hover:bg-[#e5e5e5]"
          >
            Start for Free
          </a>
          {geoConfig.hero_cta_badge && (
            <span className="text-[10px] text-green-500 font-bold tracking-widest uppercase">
              {geoConfig.hero_cta_badge}
            </span>
          )}
        </div>
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
        <span className="text-sm text-[#666666]">Trusted by 2,400+ landlords across 30+ countries</span>
      </div>
    </section>
  )
}
