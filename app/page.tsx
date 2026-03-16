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
import { cookies } from 'next/headers'
import { getGeoConfig, parseCountryCookie } from '@/lib/geo'

export const dynamic = 'force-dynamic'

function SectionDivider() {
  return <div className="section-divider mx-auto max-w-5xl" />
}

export default async function Home() {
  const cookieStore = await cookies()
  const countryCode = parseCountryCookie(cookieStore.get('geo_country')?.value)
  const geoConfig = getGeoConfig(countryCode)

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#080808]">
      <BackgroundCanvas />
      <ScrollRevealInit />
      <Navbar />
      <Hero geoConfig={geoConfig} />
      <ProductMockup />
      <TrustBar />
      <SectionDivider />
      <FeaturesBento />
      <SectionDivider />
      <AutomationSection />
      <SectionDivider />
      <AlternatingFeatures />
      <SectionDivider />
      <BuildSection />
      <SectionDivider />
      <GlobalReach />
      <SectionDivider />
      <Pricing geoConfig={geoConfig} />
      <SectionDivider />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  )
}
