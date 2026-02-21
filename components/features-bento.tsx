"use client"

import { DollarSign, Wrench, BarChart3, FileText, MessageSquare } from "lucide-react"

const rentRows = [
  { name: "Sarah M.", amount: "$1,450", status: "Paid", color: "text-[#22C55E] bg-[#22C55E]/15" },
  { name: "James W.", amount: "$1,200", status: "Overdue", color: "text-[#EF4444] bg-[#EF4444]/15" },
  { name: "Maria G.", amount: "$980", status: "Paid", color: "text-[#22C55E] bg-[#22C55E]/15" },
]

const tickets = [
  { title: "Leaking Tap", status: "Open", color: "bg-[#EF4444]/15 text-[#EF4444]" },
  { title: "Broken Heater", status: "In Progress", color: "bg-[#EAB308]/15 text-[#EAB308]" },
  { title: "Door Lock", status: "Fixed", color: "bg-[#22C55E]/15 text-[#22C55E]" },
]

export function FeaturesBento() {
  return (
    <section id="features" className="px-6 py-24 md:py-36">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="reveal mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-[rgba(255,255,255,0.1)] px-4 py-1 text-xs uppercase tracking-widest text-[#666666]">
            Features
          </span>
          <h2
            className="font-serif font-extrabold tracking-[-0.03em] text-[#ffffff]"
            style={{ fontSize: "clamp(32px, 4vw, 54px)" }}
          >
            Everything a landlord needs.
            <br />
            Nothing they don{"'"}t.
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-4 md:grid-cols-5 md:grid-rows-2">
          {/* Card A - Rent Tracking (3 cols) */}
          <div className="feature-card reveal rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-6 md:col-span-3">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8392A]/15">
              <DollarSign className="h-5 w-5 text-[#E8392A]" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#ffffff]">Rent Tracking</h3>
            <p className="mb-5 text-sm leading-relaxed text-[#666666]">
              Know exactly who paid, who{"'"}s late, and how much you{"'"}re owed — across every property. Automated reminders go out so you don{"'"}t have to chase.
            </p>
            {/* Mini rent table */}
            <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]">
              {rentRows.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between border-b border-[rgba(255,255,255,0.04)] px-4 py-2.5 last:border-0"
                >
                  <span className="text-sm text-[#999999]">{row.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#666666]">{row.amount}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${row.color}`}>
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card B - Maintenance (2 cols, 2 rows tall) */}
          <div className="feature-card reveal rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-6 md:col-span-2 md:row-span-2">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8392A]/15">
              <Wrench className="h-5 w-5 text-[#E8392A]" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#ffffff]">Maintenance Requests</h3>
            <p className="mb-5 text-sm leading-relaxed text-[#666666]">
              Tenants submit issues with photos via their portal. You track from Open to In Progress to Fixed. No more lost messages.
            </p>
            {/* Ticket cards */}
            <div className="flex flex-col gap-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.title}
                  className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] px-4 py-3"
                >
                  <span className="text-sm text-[#999999]">{ticket.title}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ticket.color}`}>
                    {ticket.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card C - Expense Tracker */}
          <div className="feature-card reveal rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8392A]/15">
              <BarChart3 className="h-5 w-5 text-[#E8392A]" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#ffffff]">Expense Tracker</h3>
            <p className="text-sm leading-relaxed text-[#666666]">
              Photograph a receipt, assign it to a property, done. Tax-ready PDF export at year end. Your accountant will thank you.
            </p>
          </div>

          {/* Card D - Lease Management */}
          <div className="feature-card reveal rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8392A]/15">
              <FileText className="h-5 w-5 text-[#E8392A]" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#ffffff]">Lease Management</h3>
            <p className="text-sm leading-relaxed text-[#666666]">
              Store all leases in one place. Automatic renewal reminders 60 days before expiry. Never be caught off-guard again.
            </p>
          </div>

          {/* Card E - Tenant Messaging */}
          <div className="feature-card reveal rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8392A]/15">
              <MessageSquare className="h-5 w-5 text-[#E8392A]" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#ffffff]">Tenant Messaging</h3>
            <p className="text-sm leading-relaxed text-[#666666]">
              Every conversation logged, searchable, and timestamped. Replace WhatsApp chaos with a proper communication trail.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
