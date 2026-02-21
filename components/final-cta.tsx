export function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-28 md:py-40">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(232,57,42,0.15) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="reveal relative z-10 mx-auto max-w-3xl text-center">
        <h2
          className="font-serif font-extrabold tracking-[-0.03em] text-[#ffffff]"
          style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
        >
          Stop managing chaos.
          <br />
          Start managing properties.
        </h2>
        <p className="mt-4 text-base text-[#666666]">
          Join 2,400+ landlords who replaced their spreadsheets with RentFlow.
        </p>
        <a
          href="#"
          className="mt-8 inline-block rounded-full bg-[#ffffff] px-10 py-4 text-lg font-bold text-[#080808] shadow-2xl transition-colors hover:bg-[#e5e5e5]"
        >
          Start Free — No Card Needed
        </a>
        <a
          href="#"
          className="mt-4 block text-center text-sm text-[#666666] transition-colors hover:text-[#ffffff]"
        >
          {"or book a 15-min demo \u2192"}
        </a>
      </div>
    </section>
  )
}
