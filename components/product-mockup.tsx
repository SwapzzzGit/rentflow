"use client"

import {
  Home,
  Building2,
  Users,
  DollarSign,
  Wrench,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react"

const sidebarItems = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: Building2, label: "Properties", active: false },
  { icon: Users, label: "Tenants", active: false },
  { icon: DollarSign, label: "Rent", active: false },
  { icon: Wrench, label: "Maintenance", active: false },
  { icon: BarChart3, label: "Expenses", active: false },
  { icon: FileText, label: "Leases", active: false },
  { icon: Settings, label: "Settings", active: false },
]

const tenantData = [
  { name: "Sarah Mitchell", property: "42 Oak Lane", rent: "$1,450", status: "Paid" },
  { name: "James Wright", property: "18 Elm Street", rent: "$1,200", status: "Overdue" },
  { name: "Maria Garcia", property: "7 River Drive", rent: "$1,650", status: "Paid" },
  { name: "Tom Anderson", property: "15 Pine Court", rent: "$980", status: "Pending" },
]

const statusColors: Record<string, string> = {
  Paid: "bg-[#22C55E]/20 text-[#22C55E]",
  Overdue: "bg-[#EF4444]/20 text-[#EF4444]",
  Pending: "bg-[#EAB308]/20 text-[#EAB308]",
}

export function ProductMockup() {
  return (
    <section className="relative px-6 pb-16">
      <div className="mx-auto max-w-6xl">
        {/* Browser Frame */}
        <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-1 shadow-2xl">
          {/* Top Bar */}
          <div className="flex items-center gap-3 rounded-t-xl bg-[rgba(255,255,255,0.04)] px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#EAB308]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
            </div>
            <div className="mx-auto rounded-md bg-[rgba(255,255,255,0.06)] px-16 py-1 text-xs text-[#444444]">
              app.rentflow.io/dashboard
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="flex min-h-[420px]">
            {/* Sidebar */}
            <div className="hidden w-[200px] flex-shrink-0 border-r border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-3 md:block">
              <div className="mb-4 flex items-center gap-2 px-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-[#E8392A]">
                  <Home className="h-3.5 w-3.5 text-[#ffffff]" />
                </div>
                <span className="text-sm font-semibold text-[#ffffff]">RentFlow</span>
              </div>
              <nav className="flex flex-col gap-0.5">
                {sidebarItems.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
                      item.active
                        ? "bg-[#E8392A]/15 text-[#E8392A]"
                        : "text-[#666666] hover:text-[#999999]"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4">
              {/* Stats Row */}
              <div className="mb-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Monthly Rent", value: "$12,400", change: "+8.2%" },
                  { label: "Paid", value: "8/10 tenants", change: "On track" },
                  { label: "Open Issues", value: "2", change: "Needs attention" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.04)] p-3"
                  >
                    <div className="text-xs text-[#666666]">{stat.label}</div>
                    <div className="mt-1 text-lg font-semibold text-[#ffffff]">{stat.value}</div>
                    <div className="mt-0.5 text-xs text-[#22C55E]">{stat.change}</div>
                  </div>
                ))}
              </div>

              {/* Tenants Table */}
              <div className="rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]">
                <div className="border-b border-[rgba(255,255,255,0.05)] px-4 py-2.5">
                  <span className="text-sm font-medium text-[#ffffff]">Recent Rent Activity</span>
                </div>
                <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {tenantData.map((tenant) => (
                    <div
                      key={tenant.name}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] text-xs text-[#ffffff]">
                          {tenant.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <div className="text-sm text-[#ffffff]">{tenant.name}</div>
                          <div className="text-xs text-[#444444]">{tenant.property}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-[#999999]">{tenant.rent}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[tenant.status]}`}
                        >
                          {tenant.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Row */}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-3">
                  <div className="mb-2 text-xs font-medium text-[#999999]">Recent Expenses</div>
                  {["Plumber - $280", "Insurance - $180", "Paint supplies - $65"].map((e) => (
                    <div key={e} className="py-1 text-xs text-[#666666]">{e}</div>
                  ))}
                </div>
                <div className="rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-3">
                  <div className="mb-2 text-xs font-medium text-[#999999]">Maintenance</div>
                  {[
                    { text: "Leaking tap", status: "Open", color: "text-[#EF4444]" },
                    { text: "Broken heater", status: "In Progress", color: "text-[#EAB308]" },
                    { text: "Door lock", status: "Fixed", color: "text-[#22C55E]" },
                  ].map((m) => (
                    <div key={m.text} className="flex items-center justify-between py-1">
                      <span className="text-xs text-[#666666]">{m.text}</span>
                      <span className={`text-xs ${m.color}`}>{m.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Glow below */}
        <div className="relative mx-auto h-10 w-2/3">
          <div className="absolute inset-0 bg-[#E8392A] opacity-20 blur-3xl" />
        </div>
      </div>
    </section>
  )
}
