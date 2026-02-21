import { BackgroundCanvas } from "@/components/background-canvas"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { ProductMockup } from "@/components/product-mockup"
import { TrustBar } from "@/components/trust-bar"
import { FeaturesBento } from "@/components/features-bento"
import { AutomationSection } from "@/components/automation-section"
import { AlternatingFeatures } from "@/components/alternating-features"
import { BuildSection } from "@/components/build-section"
import { GlobalReach } from "@/components/global-reach"
import { Pricing } from "@/components/pricing"
import { Testimonials } from "@/components/testimonials"
import { FinalCTA } from "@/components/final-cta"
import { Footer } from "@/components/footer"
import { ScrollRevealInit } from "@/components/scroll-reveal"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#080808]">
      <BackgroundCanvas />
      <ScrollRevealInit />
      <Navbar />
      <Hero />
      <ProductMockup />
      <TrustBar />
      <FeaturesBento />
      <AutomationSection />
      <AlternatingFeatures />
      <BuildSection />
      <GlobalReach />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  )
}
