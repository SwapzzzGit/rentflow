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
      "Multi-currency (USD / GBP / AUD)",
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
    <section id="pricing" className="px-6 py-24 md:py-36">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="reveal mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-[rgba(255,255,255,0.1)] px-4 py-1 text-xs uppercase tracking-widest text-[#666666]">
            Pricing
          </span>
          <h2
            className="font-serif font-extrabold tracking-[-0.03em] text-[#ffffff]"
            style={{ fontSize: "clamp(32px, 4vw, 54px)" }}
          >
            Simple pricing.
            <br />
            No surprises.
          </h2>
          <p className="mt-4 text-base text-[#666666]">
            Try free for 14 days. No credit card required.
          </p>
        </div>

        {/* Toggle */}
        <div className="reveal mb-12 flex items-center justify-center gap-3">
          <span className={`text-sm ${!annual ? "text-[#ffffff]" : "text-[#666666]"}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              annual ? "bg-[#E8392A]" : "bg-[rgba(255,255,255,0.15)]"
            }`}
            aria-label="Toggle annual pricing"
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-[#ffffff] transition-transform ${
                annual ? "translate-x-5.5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className={`text-sm ${annual ? "text-[#ffffff]" : "text-[#666666]"}`}>
            Annual <span className="text-xs text-[#22C55E]">(Save 20%)</span>
          </span>
        </div>

        {/* Cards */}
        <div className="reveal grid items-start gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? "border border-[rgba(232,57,42,0.3)] bg-[rgba(232,57,42,0.06)] shadow-2xl shadow-[rgba(153,27,27,0.2)] md:scale-105"
                  : "border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)]"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#E8392A] px-4 py-1 text-xs font-semibold text-[#ffffff]">
                  {plan.badge}
                </span>
              )}
              <div className="mb-1 text-sm font-medium text-[#999999]">{plan.tagline}</div>
              <h3 className="mb-2 text-xl font-bold text-[#ffffff]">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-[#ffffff]">
                  {annual ? plan.priceAnnual : plan.priceMonthly}
                </span>
                <span className="text-sm text-[#666666]">/mo</span>
              </div>
              <ul className="mb-8 flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#999999]">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#22C55E]" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full rounded-full py-3 text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-[#E8392A] text-[#ffffff] shadow-lg shadow-[rgba(153,27,27,0.3)] hover:bg-[#FF6B55]"
                    : "border border-[rgba(255,255,255,0.1)] text-[#ffffff] hover:bg-[rgba(255,255,255,0.05)]"
                }`}
              >
                {plan.ctaText}
              </button>
            </div>
          ))}
        </div>

        <p className="reveal mt-10 text-center text-sm text-[#444444]">
          All plans include a 14-day free trial. Cancel anytime. Questions? hello@rentflow.io
        </p>
      </div>
    </section>
  )
}
