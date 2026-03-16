'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SetupData } from '@/types/setup'
import { StepLandlord } from '@/components/setup/StepLandlord'
import { StepProperty } from '@/components/setup/StepProperty'
import { StepTenant } from '@/components/setup/StepTenant'
import { StepDone } from '@/components/setup/StepDone'

// ── Progress Bar ──────────────────────────────────────────────────────────────
const STEPS = ['You', 'Property', 'Tenant', 'Done']

function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 w-full max-w-sm mx-auto">
      {STEPS.map((label, i) => {
        const stepNum = i + 1
        const isCompleted = currentStep > stepNum
        const isActive = currentStep === stepNum
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={{
                  background: isCompleted
                    ? '#10b981'
                    : isActive
                    ? '#0f172a'
                    : '#f1f5f9',
                  color: isCompleted || isActive ? '#fff' : '#94a3b8',
                  border: isActive ? '2px solid #0f172a' : '2px solid transparent',
                }}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 3.5L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className="text-[10px] font-medium mt-1 whitespace-nowrap"
                style={{ color: isActive ? '#0f172a' : '#94a3b8' }}
              >
                {label}
              </span>
            </div>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1 mb-4 transition-colors duration-300"
                style={{ background: isCompleted ? '#10b981' : '#e2e8f0' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Default wizard data ───────────────────────────────────────────────────────
const DEFAULT_DATA: SetupData = {
  full_name: '',
  currency: 'GBP',
  currency_symbol: '£',
  country: '',
  property_address: '',
  property_name: '',
  property_type: '',
  bedrooms: 1,
  monthly_rent: 0,
  property_vacant: false,
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [data, setData] = useState<SetupData>(DEFAULT_DATA)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdSummary, setCreatedSummary] = useState<string[]>([])

  function patch(updates: Partial<SetupData>) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  async function finishSetup(finalPatch?: Partial<SetupData>) {
    const payload: SetupData = finalPatch
      ? { ...data, ...finalPatch }
      : data

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()

      if (!res.ok || !result.success) {
        setError(result.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      setCreatedSummary(result.summary ?? [])
      setStep(4)
    } catch {
      setError('Network error – please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleAddAnother() {
    // Reset property + tenant fields but keep profile data, go back to step 2
    setData((prev) => ({
      ...prev,
      property_address: '',
      property_type: '',
      bedrooms: 1,
      monthly_rent: 0,
      property_vacant: false,
      tenant_name: undefined,
      tenant_email: undefined,
      tenant_phone: undefined,
      move_in_date: undefined,
      lease_end_date: undefined,
    }))
    setCreatedSummary([])
    setError(null)
    setStep(2)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-[#E8392A] rounded-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M3 14V7.5L9 3L15 7.5V14C15 14.55 14.55 15 14 15H10.5V11H7.5V15H4C3.45 15 3 14.55 3 14Z" fill="white" />
          </svg>
        </div>
        <span
          className="text-lg font-bold text-slate-900 tracking-tight"
          style={{ fontFamily: 'var(--font-bricolage, sans-serif)' }}
        >
          RentFlow
        </span>
      </div>

      <div className="w-full max-w-lg">
        <ProgressBar currentStep={step} />

        {step === 1 && (
          <StepLandlord
            data={data}
            onNext={(updates) => { patch(updates); setError(null); setStep(2) }}
          />
        )}

        {step === 2 && (
          <StepProperty
            data={data}
            onNext={(updates) => { patch(updates); setError(null); setStep(3) }}
            onBack={() => { setError(null); setStep(1) }}
            onSkip={(updates) => finishSetup({ ...updates, property_vacant: true })}
            error={error}
          />
        )}

        {step === 3 && (
          <StepTenant
            data={data}
            onSubmit={(updates) => finishSetup(updates)}
            onBack={() => { setError(null); setStep(2) }}
            loading={loading}
            error={error}
          />
        )}

        {step === 4 && (
          <StepDone
            landlordName={data.full_name}
            summary={createdSummary}
            onGo={() => router.push('/dashboard')}
            onAddAnother={handleAddAnother}
          />
        )}
      </div>
    </div>
  )
}
