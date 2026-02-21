"use client"

import { useState } from "react"
import { Home, Menu, X } from "lucide-react"

const navLinks = ["Features", "Pricing", "For Tenants", "Changelog", "Blog"]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <div className="mx-auto max-w-[900px] flex items-center justify-between rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(10,10,10,0.8)] backdrop-blur-2xl px-6 py-3">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8392A]">
            <Home className="h-4 w-4 text-[#ffffff]" />
          </div>
          <span className="font-serif text-lg font-bold text-[#ffffff]">RentFlow</span>
        </a>

        {/* Center Links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm text-[#999999] transition-colors hover:text-[#ffffff]"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <a href="#" className="hidden text-sm text-[#999999] transition-colors hover:text-[#ffffff] md:block">
            Log in
          </a>
          <a
            href="#"
            className="rounded-full bg-[#ffffff] px-5 py-2 text-sm font-semibold text-[#080808] transition-colors hover:bg-[#e5e5e5]"
          >
            Get Started
          </a>
          <button
            className="text-[#999999] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[72px] z-40 flex flex-col items-center gap-6 bg-[#080808]/95 backdrop-blur-xl pt-16 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-lg text-[#999999] transition-colors hover:text-[#ffffff]"
              onClick={() => setMobileOpen(false)}
            >
              {link}
            </a>
          ))}
          <a
            href="#"
            className="text-lg text-[#999999] transition-colors hover:text-[#ffffff]"
            onClick={() => setMobileOpen(false)}
          >
            Log in
          </a>
        </div>
      )}
    </nav>
  )
}
