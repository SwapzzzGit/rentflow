export function TrustBar() {
  const logos = [
    "Zillow listings",
    "Rightmove UK",
    "Domain AU",
    "Xero accounting",
    "Stripe payments",
  ]

  return (
    <section className="reveal-blur border-y border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] py-12">
      <p className="mb-6 text-center text-xs uppercase tracking-widest text-[#444444]">
        Used by independent landlords worldwide
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8 px-6 md:gap-12">
        {logos.map((logo) => (
          <span
            key={logo}
            className="text-sm font-medium text-[#444444] transition-colors hover:text-[#666666]"
          >
            {logo}
          </span>
        ))}
      </div>
    </section>
  )
}
