export function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(232,57,42,0.15) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2
          className="reveal-blur font-serif font-extrabold tracking-[-0.025em] text-[#ffffff]"
          style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: "1.1" }}
        >
          Stop managing chaos.
          <br />
          Start managing properties.
        </h2>
        <p className="reveal-blur stagger-2 mt-4 text-base leading-[1.65] text-[#666666]">
          Join 2,400+ landlords who replaced their spreadsheets with RentFlow.
        </p>
        <div className="reveal-blur stagger-3 mt-8">
          <a
            href="#"
            className="inline-block rounded-full bg-[#ffffff] px-10 py-4 text-lg font-bold text-[#080808] shadow-2xl transition-colors hover:bg-[#e5e5e5]"
          >
            Start Free — No Card Needed
          </a>
        </div>
        <a
          href="#"
          className="reveal-blur stagger-4 mt-4 block text-center text-sm text-[#666666] transition-colors hover:text-[#ffffff]"
        >
          {"or book a 15-min demo \u2192"}
        </a>
      </div>
    </section>
  )
}
