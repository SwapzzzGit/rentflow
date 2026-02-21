import { Home } from "lucide-react"

const columns = [
  {
    heading: "Product",
    links: ["Features", "Pricing", "Changelog", "Roadmap", "Status"],
  },
  {
    heading: "For Landlords",
    links: ["1-5 Units", "6-20 Units", "US & Canada", "UK & Ireland", "AU & New Zealand", "Asia & Middle East"],
  },
  {
    heading: "Resources",
    links: ["Blog", "Help Center", "API Docs", "Community", "Templates"],
  },
  {
    heading: "Company",
    links: ["About", "Careers", "Press", "Privacy Policy", "Terms of Service"],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#080808] px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 grid-cols-2 md:grid-cols-5">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <a href="#" className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8392A]">
              <Home className="h-4 w-4 text-[#ffffff]" />
            </div>
            <span className="font-serif text-lg font-bold text-[#ffffff]">RentFlow</span>
          </a>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#444444]">
            Property management
            <br />
            for real people.
          </p>
          {/* Social Icons */}
          <div className="mt-4 flex gap-2">
            {["X", "Li", "In", "Gh"].map((icon) => (
              <a
                key={icon}
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] text-xs text-[#666666] transition-colors hover:border-[rgba(255,255,255,0.2)] hover:text-[#ffffff]"
                aria-label={icon}
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Link Columns */}
        {columns.map((col) => (
          <div key={col.heading}>
            <h4 className="mb-5 text-sm font-semibold text-[#ffffff]">{col.heading}</h4>
            <ul className="flex flex-col">
              {col.links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="mb-2.5 block text-sm text-[#666666] transition-colors hover:text-[#cccccc]"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-[rgba(255,255,255,0.05)] pt-6 text-xs text-[#444444]">
        <span>{"\u00A9"} 2026 RentFlow | Managed by Orange Rock LLC | All rights reserved.</span>
        <span>{"\uD83C\uDDFA\uD83C\uDDF8"} United States {"\u00B7"} {"\uD83C\uDDEC\uD83C\uDDE7"} United Kingdom {"\u00B7"} {"\uD83C\uDDE6\uD83C\uDDFA"} Australia</span>
      </div>
    </footer>
  )
}
