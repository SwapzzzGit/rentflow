'use client'

import { useState, useEffect } from 'react'
import { SetupData } from '@/types/setup'
import { WizardCard, WizardField, WizardSelect, WizardCTA } from './WizardShared'
import { getGeoConfig, parseCountryCookie } from '@/lib/geo'

const CURRENCIES = [
  { value: 'GBP', label: '£ British Pound (GBP)', symbol: '£' },
  { value: 'USD', label: '$ US Dollar (USD)', symbol: '$' },
  { value: 'AUD', label: '$ Australian Dollar (AUD)', symbol: '$' },
  { value: 'EUR', label: '€ Euro (EUR)', symbol: '€' },
  { value: 'INR', label: '₹ Indian Rupee (INR)', symbol: '₹' },
  { value: 'CAD', label: '$ Canadian Dollar (CAD)', symbol: '$' },
  { value: 'NZD', label: '$ New Zealand Dollar (NZD)', symbol: '$' },
  { value: 'ZAR', label: 'R South African Rand (ZAR)', symbol: 'R' },
]

const COUNTRIES = [
  'United Kingdom', 'United States', 'Australia', 'Canada',
  'New Zealand', 'India', 'South Africa', 'Ireland', 'Singapore', 'Other',
]

export function StepLandlord({
  data,
  onNext,
}: {
  data: Partial<SetupData>
  onNext: (patch: Partial<SetupData>) => void
}) {
  const [fullName, setFullName] = useState(data.full_name ?? '')
  const [currency, setCurrency] = useState(data.currency ?? 'GBP')
  const [country, setCountry] = useState(data.country ?? '')

  useEffect(() => {
    // Only pre-fill if hasn't started typing and values are currently defaults
    if (fullName) return

    const cookies = document.cookie.split(';').reduce((acc, c) => {
      const [k, v] = c.trim().split('=')
      if (k) acc[k] = v
      return acc
    }, {} as Record<string, string>)

    const countryCode = parseCountryCookie(cookies['geo_country'])
    if (!countryCode) return

    const config = getGeoConfig(countryCode)

    // If user hasn't touched the defaults yet, pre-fill from geo
    if (currency === 'GBP' && (country === '' || country === 'United Kingdom')) {
      setCurrency(config.currency)
      setCountry(config.country_name)
    }
  }, [])

  const canContinue = fullName.trim().length > 0 && !!currency && !!country

  function handleNext() {
    const cur = CURRENCIES.find((c) => c.value === currency)
    onNext({
      full_name: fullName.trim(),
      currency,
      currency_symbol: cur?.symbol ?? '£',
      country,
    })
  }

  return (
    <WizardCard
      title="Tell us about you"
      subtitle="This sets up your landlord profile and default currency."
    >
      <WizardField label="Your full name" required>
        <input
          type="text"
          className="wizard-input"
          placeholder="Jane Smith"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoFocus
        />
      </WizardField>

      <WizardField label="Currency">
        <WizardSelect
          value={currency}
          onChange={setCurrency}
          options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))}
        />
      </WizardField>

      <WizardField label="Country">
        <WizardSelect
          value={country}
          onChange={setCountry}
          placeholder="Select your country"
          options={COUNTRIES.map((c) => ({ value: c, label: c }))}
        />
      </WizardField>

      <WizardCTA onClick={handleNext} disabled={!canContinue}>
        Continue →
      </WizardCTA>
    </WizardCard>
  )
}
