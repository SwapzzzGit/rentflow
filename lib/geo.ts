// lib/geo.ts
// Central config for all geo-based personalization.
// One function: getGeoConfig(countryCode) → returns full config object.
// Used by: app/page.tsx (homepage), StepLandlord.tsx (wizard pre-fill)

export interface GeoConfig {
  country_code: string
  country_name: string
  currency: string
  currency_symbol: string
  // Homepage hero
  hero_headline: string
  hero_subheadline: string
  hero_cta_badge: string | null
  // Pricing
  pricing_starter: number
  pricing_pro: number
  pricing_advanced: number
  pricing_currency_label: string
  // Tax messaging
  tax_label: string
  tax_urgency: string | null
  // SEO meta
  meta_title: string
  meta_description: string
}

const GEO_CONFIGS: Record<string, GeoConfig> = {
  GB: {
    country_code: 'GB',
    country_name: 'United Kingdom',
    currency: 'GBP',
    currency_symbol: '£',
    hero_headline: 'MTD-ready property management for UK landlords',
    hero_subheadline: 'Making Tax Digital starts April 2026. Stay compliant, track expenses, and manage tenants — all in one place.',
    hero_cta_badge: 'MTD compliant',
    pricing_starter: 9,
    pricing_pro: 19,
    pricing_advanced: 39,
    pricing_currency_label: '£',
    tax_label: 'HMRC',
    tax_urgency: 'MTD deadline: April 6, 2026',
    meta_title: 'RentFlow — MTD-Ready Property Management for UK Landlords',
    meta_description: 'Track rent, expenses, and tenants. HMRC Making Tax Digital compliant. Built for UK landlords with 1–10 properties.',
  },
  AU: {
    country_code: 'AU',
    country_name: 'Australia',
    currency: 'AUD',
    currency_symbol: 'A$',
    hero_headline: 'The ATO is auditing 2.2M landlords. Are your records clean?',
    hero_subheadline: 'RentFlow keeps your rental income, expenses, and receipts audit-ready. Stop managing in spreadsheets.',
    hero_cta_badge: 'ATO audit-ready',
    pricing_starter: 13,
    pricing_pro: 27,
    pricing_advanced: 55,
    pricing_currency_label: 'A$',
    tax_label: 'ATO',
    tax_urgency: 'ATO data-matching active now',
    meta_title: 'RentFlow — Rental Property Management for Australian Landlords',
    meta_description: 'Track rent, expenses, and tenants. ATO-ready expense records. Built for Australian landlords with 1–10 properties.',
  },
  US: {
    country_code: 'US',
    country_name: 'United States',
    currency: 'USD',
    currency_symbol: '$',
    hero_headline: 'Stop managing your properties. Start owning them.',
    hero_subheadline: 'Replace spreadsheets, WhatsApp, and bank tabs with one dashboard. Rent tracking, maintenance, expenses — all connected.',
    hero_cta_badge: 'Free for tenants',
    pricing_starter: 9,
    pricing_pro: 19,
    pricing_advanced: 39,
    pricing_currency_label: '$',
    tax_label: 'IRS Schedule E',
    tax_urgency: null,
    meta_title: 'RentFlow — Property Management Software for Small Landlords',
    meta_description: 'Track rent, maintenance, and expenses in one place. Built for landlords with 1–10 properties. Tenants pay zero fees.',
  },
  CA: {
    country_code: 'CA',
    country_name: 'Canada',
    currency: 'CAD',
    currency_symbol: 'C$',
    hero_headline: 'Manage 3 properties like a company manages 300.',
    hero_subheadline: 'Rent tracking, maintenance tickets, expense reports, and a tenant portal — all in one simple dashboard.',
    hero_cta_badge: null,
    pricing_starter: 12,
    pricing_pro: 25,
    pricing_advanced: 49,
    pricing_currency_label: 'C$',
    tax_label: 'CRA',
    tax_urgency: null,
    meta_title: 'RentFlow — Property Management Software for Canadian Landlords',
    meta_description: 'Track rent, maintenance, and expenses in one place. Built for landlords with 1–10 properties.',
  },
  IN: {
    country_code: 'IN',
    country_name: 'India',
    currency: 'INR',
    currency_symbol: '₹',
    hero_headline: 'Manage 3 properties like a company manages 300.',
    hero_subheadline: 'Replace WhatsApp and spreadsheets with one simple dashboard. Rent tracking, maintenance, and tenant portal.',
    hero_cta_badge: null,
    pricing_starter: 749,
    pricing_pro: 1499,
    pricing_advanced: 2999,
    pricing_currency_label: '₹',
    tax_label: 'ITR',
    tax_urgency: null,
    meta_title: 'RentFlow — Property Management Software for Indian Landlords',
    meta_description: 'Track rent, maintenance, and expenses. Built for landlords with 1–10 properties.',
  },
}

// Default config for any country not in the list above
const DEFAULT_CONFIG: GeoConfig = {
  country_code: 'US',
  country_name: 'United States',
  currency: 'USD',
  currency_symbol: '$',
  hero_headline: 'Manage 3 properties like a company manages 300.',
  hero_subheadline: 'Replace spreadsheets, WhatsApp, and bank tabs with one dashboard. Rent tracking, maintenance, expenses — all connected.',
  hero_cta_badge: null,
  pricing_starter: 9,
  pricing_pro: 19,
  pricing_advanced: 39,
  pricing_currency_label: '$',
  tax_label: 'Tax',
  tax_urgency: null,
  meta_title: 'RentFlow — Simple Property Management for Small Landlords',
  meta_description: 'Track rent, maintenance, and expenses in one place. Built for landlords with 1–10 properties.',
}

export function getGeoConfig(countryCode: string | null | undefined): GeoConfig {
  if (!countryCode) return DEFAULT_CONFIG
  return GEO_CONFIGS[countryCode.toUpperCase()] ?? DEFAULT_CONFIG
}

// Helper: get country code from cookie string
export function parseCountryCookie(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null
  // Validate it's a 2-letter country code
  if (/^[A-Z]{2}$/.test(cookieValue.toUpperCase())) return cookieValue.toUpperCase()
  return null
}
