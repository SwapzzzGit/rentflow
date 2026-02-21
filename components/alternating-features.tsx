"use client"

import { Building2, Users, BarChart3, Check, CreditCard, Camera, FileText } from "lucide-react"

// Section 08 - Multi-Property
function MultiPropertyFeature() {
  return (
    <div className="reveal mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
      {/* Left - Text */}
      <div>
        <span className="mb-4 inline-block text-xs uppercase tracking-widest text-[#E8392A]">
          Multi-Property
        </span>
        <h2
          className="font-serif font-extrabold tracking-[-0.03em] text-[#ffffff]"
          style={{ fontSize: "clamp(32px, 4vw, 54px)" }}
        >
          Manage 10 properties
          <br />
          as easily as 1.
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-[#666666]">
          Switch between properties in one tap. Every tenant, lease, payment, and issue organized by property. Your portfolio at a glance.
        </p>
        <ul className="mt-6 flex flex-col gap-2.5">
          {[
            "Property-level dashboards",
            "Aggregate income view",
            "Per-property expense reports",
            "Bulk rent tracking",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-[#999999]">
              <Check className="h-4 w-4 text-[#22C55E]" />
              {f}
            </li>
          ))}
        </ul>
        <a href="#features" className="mt-6 inline-block text-sm text-[#E8392A] transition-colors hover:underline">
          {"See all features \u2192"}
        </a>
      </div>

      {/* Right - Property Switcher Card */}
      <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 shadow-2xl">
        <div className="mb-4 text-xs font-medium uppercase tracking-wider text-[#666666]">Properties</div>
        <div className="flex flex-col gap-2">
          {[
            { addr: "42 Oak Lane, Austin TX", units: "3 units", color: "#E8392A", active: true },
            { addr: "18 Elm Street, Denver CO", units: "2 units", color: "#3B82F6", active: false },
            { addr: "7 River Drive, Portland OR", units: "4 units", color: "#22C55E", active: false },
            { addr: "15 Pine Court, Miami FL", units: "1 unit", color: "#EAB308", active: false },
          ].map((p) => (
            <div
              key={p.addr}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                p.active
                  ? "border border-[#E8392A]/30 bg-[#E8392A]/10"
                  : "border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.1)]"
              }`}
            >
              <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: p.color + "30" }}>
                <Building2 className="m-1.5 h-5 w-5" style={{ color: p.color }} />
              </div>
              <div className="flex-1">
                <div className="text-sm text-[#ffffff]">{p.addr}</div>
                <div className="text-xs text-[#666666]">{p.units}</div>
              </div>
              {p.active && <span className="h-2 w-2 rounded-full bg-[#22C55E]" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Section 09 - Tenant Portal
function TenantPortalFeature() {
  return (
    <div className="reveal mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
      {/* Left - Tenant View Card (blue accent) */}
      <div className="order-2 rounded-2xl border border-[#3B82F6]/20 bg-[rgba(59,130,246,0.05)] p-5 shadow-2xl shadow-[rgba(30,64,175,0.2)] md:order-1">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-[#3B82F6]" />
          <span className="text-xs font-medium uppercase tracking-wider text-[#3B82F6]">Tenant Portal</span>
        </div>
        {/* Rent payment card */}
        <div className="mb-4 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.03)] p-4">
          <div className="text-xs text-[#666666]">Rent Due - Feb 1</div>
          <div className="mt-1 text-2xl font-bold text-[#ffffff]">$1,450.00</div>
          <button className="mt-3 w-full rounded-lg bg-[#22C55E] py-2.5 text-sm font-semibold text-[#ffffff]">
            Pay Rent Now
          </button>
        </div>
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-3">
            <Camera className="h-4 w-4 text-[#666666]" />
            <span className="text-xs text-[#999999]">Report Issue</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-3">
            <FileText className="h-4 w-4 text-[#666666]" />
            <span className="text-xs text-[#999999]">View Lease</span>
          </div>
        </div>
        {/* Message thread preview */}
        <div className="mt-3 rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-3">
          <div className="text-xs font-medium text-[#999999]">Messages</div>
          <div className="mt-2 rounded-lg bg-[rgba(59,130,246,0.1)] p-2 text-xs text-[#3B82F6]">
            {"Hi, the kitchen tap has started leaking again. I've attached a photo."}
          </div>
        </div>
      </div>

      {/* Right - Text */}
      <div className="order-1 md:order-2">
        <span className="mb-4 inline-block text-xs uppercase tracking-widest text-[#3B82F6]">
          Tenant Portal
        </span>
        <h2
          className="font-serif font-extrabold tracking-[-0.03em] text-[#ffffff]"
          style={{ fontSize: "clamp(32px, 4vw, 54px)" }}
        >
          Your tenants get
          <br />
          their own app too.
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-[#666666]">
          Tenants log in to pay rent, submit maintenance requests, view their lease, and message you — all without using WhatsApp.
        </p>
        <ul className="mt-6 flex flex-col gap-2.5">
          {[
            "Mobile-friendly tenant portal",
            "Rent payment via card or bank transfer",
            "Photo maintenance submissions",
            "Lease document access",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-[#999999]">
              <Check className="h-4 w-4 text-[#22C55E]" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Section 10 - Tax Ready
function TaxReadyFeature() {
  return (
    <div className="reveal mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
      {/* Left - Text */}
      <div>
        <span className="mb-4 inline-block text-xs uppercase tracking-widest text-[#E8392A]">
          Tax Ready
        </span>
        <h2
          className="font-serif font-extrabold tracking-[-0.03em] text-[#ffffff]"
          style={{ fontSize: "clamp(32px, 4vw, 54px)" }}
        >
          End the spreadsheet
          <br />
          nightmare for good.
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-[#666666]">
          Every expense logged with receipt photo. Every rent payment recorded. At tax time: one click, one export, done. Your accountant gets a clean PDF.
        </p>
        <ul className="mt-6 flex flex-col gap-2.5">
          {[
            "Receipt photo storage",
            "Category auto-tagging",
            "Annual income statement",
            "Expense breakdown by property",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-[#999999]">
              <Check className="h-4 w-4 text-[#22C55E]" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Right - Expense tracker card */}
      <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 shadow-2xl">
        <div className="mb-4 text-xs font-medium uppercase tracking-wider text-[#666666]">Expense Summary</div>
        <div className="flex flex-col gap-3">
          {[
            { category: "Repairs", amount: "$820", pct: 15 },
            { category: "Insurance", amount: "$1,200", pct: 22 },
            { category: "Mortgage", amount: "$14,400", pct: 85 },
            { category: "Utilities", amount: "$640", pct: 12 },
          ].map((e) => (
            <div key={e.category}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-[#999999]">{e.category}</span>
                <span className="text-sm font-medium text-[#ffffff]">{e.amount}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)]">
                <div
                  className="h-full rounded-full bg-[#E8392A]"
                  style={{ width: `${e.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8392A]/15 py-3 text-sm font-semibold text-[#E8392A] transition-colors hover:bg-[#E8392A]/25">
          <BarChart3 className="h-4 w-4" />
          Export PDF Report
        </button>
      </div>
    </div>
  )
}

export function AlternatingFeatures() {
  return (
    <>
      <MultiPropertyFeature />
      <TenantPortalFeature />
      <TaxReadyFeature />
    </>
  )
}
