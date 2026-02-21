"use client"

import { useState } from "react"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    priceMonthly: "$0",
    priceAnnual: "$0",
    tagline: "Get started, no strings",
    features: [
      "1 property",
      "Up to 2 tenants",
      "Basic rent tracking",
      "Email support",
    ],
    ctaText: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Starter",
    priceMonthly: "$9.99",
    priceAnnual: "$7.99",
    tagline: "For the serious landlord",
    badge: "Most Popular",
    features: [
      "Up to 5 properties",
      "Unlimited tenants",
      "Rent tracking + reminders",
      "Expense tracker + receipts",
      "Maintenance request portal",
      "Tenant messaging",
      "PDF tax export",
      "Priority support",
    ],
    ctaText: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Pro",
    priceMonthly: "$17.99",
    priceAnnual: "$14.99",
    tagline: "For growing portfolios",
    features: [
      "Unlimited properties",
      "Everything in Starter",
      "Multi-currency (20+ currencies worldwide)",
      "Advanced analytics dashboard",
      "Bank-level export (CSV + PDF)",
      "Lease document storage",
      "Custom reminder schedules",
      "Dedicated account support",
    ],
    ctaText: "Start Free Trial",
    highlighted: false,
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" className="px-6 py-20 md:py-24">
      <div className="mx-auto max-w-[1000px]">
        {/* Header */}
        <div className="reveal-blur mb-10 text-center">
          <span className="mb-4 inline-block rounded-full border border-[rgba(255,255,255,0.1)] px-4 py-1 text-xs uppercase tracking-widest text-[#666666]">
            Pricing
          </span>
          <h2
            className="font-serif font-extrabold tracking-[-0.025em] text-[#ffffff]"
            style={{ fontSize: "clamp(32px, 4vw, 54px)", lineHeight: "1.1" }}
          >
            Simple pricing.
            <br />
            No surprises.
          </h2>
          <p className="mt-4 text-base leading-[1.65] text-[#666666]">
            Try free for 14 days. Available worldwide. No credit card required.
          </p>
        </div>

        {/* Toggle */}
        <div className="reveal-blur mb-10 flex items-center justify-center gap-3">
          <span className={`text-sm transition-colors ${!annual ? "text-[#ffffff]" : "text-[#666666]"}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative h-7 w-12 rounded-full transition-colors ${annual ? "bg-[#E8392A]" : "bg-[rgba(255,255,255,0.15)]"}`}
            aria-label="Toggle annual pricing"
          >
            <span
              className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-[#ffffff] transition-transform duration-200"
              style={{ transform: annual ? "translateX(20px)" : "translateX(0px)" }}
            />
          </button>
          <span className={`text-sm transition-colors ${annual ? "text-[#ffffff]" : "text-[#666666]"}`}>
            Annual <span className="text-xs text-[#E8392A]">(Save 20%)</span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {plans.map((plan, idx) => (
            <div
              key={plan.name}
              className={`reveal-blur ${idx === 0 ? "stagger-1" : idx === 1 ? "stagger-2" : "stagger-3"} relative flex flex-col overflow-hidden rounded-[20px] p-8 transition-all duration-200 ${
                plan.highlighted
                  ? "border border-[rgba(232,57,42,0.5)] bg-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(232,57,42,0.2),0_24px_80px_rgba(232,57,42,0.15)] hover:border-[rgba(232,57,42,0.7)]"
                  : "border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:translate-y-[-4px] hover:border-[rgba(255,255,255,0.15)]"
              }`}
            >
              {/* Top glow bar for highlighted */}
              {plan.highlighted && (
                <div
                  className="absolute left-0 right-0 top-0 h-[2px]"
                  style={{ background: "linear-gradient(90deg, transparent, #E8392A, transparent)" }}
                />
              )}

              {/* Badge inside card */}
              {plan.badge && (
                <span className="mb-4 inline-flex w-fit rounded-full bg-[#E8392A] px-3 py-1 text-xs font-semibold text-[#ffffff]">
                  {plan.badge}
                </span>
              )}

              <div className="mb-1 text-sm font-medium text-[#999999]">{plan.tagline}</div>
              <h3 className="mb-3 text-xl font-bold text-[#ffffff]">{plan.name}</h3>
              <div className="mb-6">
                <span
                  className="font-mono font-bold tracking-[-0.02em] text-[#ffffff]"
                  style={{ fontSize: "clamp(40px, 5vw, 56px)" }}
                >
                  {annual ? plan.priceAnnual : plan.priceMonthly}
                </span>
                <span className="ml-1 text-base text-[#666666]">/mo</span>
              </div>
              <ul className="mb-8 flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#999999]">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E8392A]" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <button
                  className={`w-full rounded-full py-3 text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-[#E8392A] text-[#ffffff] shadow-lg shadow-[rgba(232,57,42,0.3)] hover:bg-[#FF6B55]"
                      : "border border-[rgba(255,255,255,0.1)] text-[#ffffff] hover:bg-[rgba(255,255,255,0.05)]"
                  }`}
                >
                  {plan.ctaText}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="reveal-blur mt-10 text-center text-sm text-[#444444]">
          All plans include a 14-day free trial. Cancel anytime. Questions? hello@rentflow.io
        </p>
      </div>
    </section>
  )
}
