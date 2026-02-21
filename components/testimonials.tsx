"use client"

const testimonials = [
  {
    quote: "I was using 3 spreadsheets and a notes app. RentFlow replaced all of them in a single afternoon.",
    author: "James K.",
    location: "Sydney, AU",
    detail: "4 properties / 6 tenants",
    initials: "JK",
    color: "#1D4ED8",
  },
  {
    quote: "The tax export alone is worth $9.99 a month. Saved me 6 hours this April.",
    author: "Sarah M.",
    location: "Austin, TX",
    detail: "3 properties / 5 tenants",
    initials: "SM",
    color: "#7C3AED",
  },
  {
    quote: "My tenants actually love having their own portal. Zero awkward payment texts now.",
    author: "Priya T.",
    location: "London, UK",
    detail: "2 properties / 3 tenants",
    initials: "PT",
    color: "#059669",
  },
  {
    quote: "Finally an app that doesn't assume I manage 500 units. This is built for people like me.",
    author: "Marcus R.",
    location: "Denver, CO",
    detail: "5 properties / 9 tenants",
    initials: "MR",
    color: "#D97706",
  },
]

export function Testimonials() {
  return (
    <section className="px-6 py-20 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="reveal-blur mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-[rgba(255,255,255,0.1)] px-4 py-1 text-xs uppercase tracking-widest text-[#666666]">
            What Landlords Say
          </span>
          <h2
            className="font-serif font-extrabold tracking-[-0.025em] text-[#ffffff]"
            style={{ fontSize: "clamp(32px, 4vw, 54px)", lineHeight: "1.1" }}
          >
            They switched.
            <br />
            They never looked back.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {testimonials.map((t, idx) => (
            <div
              key={t.author}
              className={`reveal-blur stagger-${idx + 1} rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-6 transition-colors hover:border-[rgba(255,255,255,0.12)]`}
            >
              <p className="mb-6 text-base leading-[1.65] text-[#999999]">
                {'"'}{t.quote}{'"'}
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-[#ffffff]"
                  style={{ backgroundColor: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#ffffff]">{t.author}</div>
                  <div className="text-xs text-[#666666]">
                    {t.location} / {t.detail}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
