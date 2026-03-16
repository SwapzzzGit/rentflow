'use client'

import { useState } from 'react'
import { SetupData } from '@/types/setup'
import { WizardCard, WizardField, WizardSelect, WizardCTA, WizardBackButton } from './WizardShared'

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment / Flat' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'room', label: 'Room / HMO' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'other', label: 'Other' },
]

const BEDROOM_OPTIONS = [
  { value: '0', label: 'Studio (0)' },
  { value: '1', label: '1 bedroom' },
  { value: '2', label: '2 bedrooms' },
  { value: '3', label: '3 bedrooms' },
  { value: '4', label: '4 bedrooms' },
  { value: '5', label: '5+ bedrooms' },
]

export function StepProperty({
  data,
  onNext,
  onBack,
  onSkip,
  error,
}: {
  data: Partial<SetupData>
  onNext: (patch: Partial<SetupData>) => void
  onBack: () => void
  onSkip: (patch: Partial<SetupData>) => void
  error?: string | null
}) {
  const [propertyName, setPropertyName] = useState(data.property_name ?? '')
  const [address, setAddress] = useState(data.property_address ?? '')
  const [propertyType, setPropertyType] = useState(data.property_type ?? '')
  const [bedrooms, setBedrooms] = useState(String(data.bedrooms ?? '1'))
  const [monthlyRent, setMonthlyRent] = useState(data.monthly_rent ? String(data.monthly_rent) : '')
  const [vacant, setVacant] = useState(data.property_vacant ?? false)

  const currencySymbol = data.currency_symbol ?? '£'
  const canContinue = address.trim().length > 0 && !!propertyType && Number(monthlyRent) > 0

  function buildPatch(): Partial<SetupData> {
    return {
      property_name: propertyName.trim(),
      property_address: address.trim(),
      property_type: propertyType,
      bedrooms: Number(bedrooms),
      monthly_rent: Number(monthlyRent),
      property_vacant: vacant,
    }
  }

  return (
    <WizardCard
      title="Add your first property"
      subtitle="You can add more properties later from your dashboard."
    >
      <WizardBackButton onClick={onBack} />

      <WizardField label="Property name">
        <input
          type="text"
          className="wizard-input"
          placeholder="e.g. Oak Lane Apartment, Flat 2B (Optional)"
          value={propertyName}
          onChange={(e) => setPropertyName(e.target.value)}
          autoFocus
        />
        <p className="text-[11px] text-slate-400 mt-1">A nickname for this property. If blank, the address will be used.</p>
      </WizardField>

      <WizardField label="Property address" required>
        <input
          type="text"
          className="wizard-input"
          placeholder="12 Baker Street, London, W1U 3BH"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </WizardField>

      <div className="grid grid-cols-2 gap-3">
        <WizardField label="Property type">
          <WizardSelect
            value={propertyType}
            onChange={setPropertyType}
            placeholder="Select type"
            options={PROPERTY_TYPES}
          />
        </WizardField>

        <WizardField label="Bedrooms">
          <WizardSelect
            value={bedrooms}
            onChange={setBedrooms}
            options={BEDROOM_OPTIONS}
          />
        </WizardField>
      </div>

      <WizardField label="Monthly rent" required>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none select-none z-10">
            {currencySymbol}
          </span>
          <input
            type="number"
            className="wizard-input pl-8"
            placeholder="1200"
            value={monthlyRent}
            min={0}
            onChange={(e) => setMonthlyRent(e.target.value)}
          />
        </div>
      </WizardField>

      {/* Vacant toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none py-1">
        <div
          onClick={() => setVacant(!vacant)}
          className="relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
          style={{ background: vacant ? '#0f172a' : '#e2e8f0' }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
            style={{ transform: vacant ? 'translateX(22px)' : 'translateX(2px)' }}
          />
        </div>
        <span className="text-sm text-slate-600">
          Property is currently <strong>vacant</strong> (no tenant yet)
        </span>
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <WizardCTA
        onClick={() => vacant ? onSkip(buildPatch()) : onNext(buildPatch())}
        disabled={!canContinue}
      >
        {vacant ? 'Finish setup →' : 'Continue →'}
      </WizardCTA>
    </WizardCard>
  )
}
