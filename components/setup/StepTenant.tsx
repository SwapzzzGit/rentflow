'use client'

import { useState } from 'react'
import { SetupData } from '@/types/setup'
import { WizardCard, WizardField, WizardCTA, WizardBackButton } from './WizardShared'

export function StepTenant({
  data,
  onSubmit,
  onBack,
  loading,
  error,
}: {
  data: Partial<SetupData>
  onSubmit: (patch: Partial<SetupData>) => void
  onBack: () => void
  loading: boolean
  error: string | null
}) {
  const [tenantName, setTenantName] = useState(data.tenant_name ?? '')
  const [tenantEmail, setTenantEmail] = useState(data.tenant_email ?? '')
  const [tenantPhone, setTenantPhone] = useState(data.tenant_phone ?? '')
  const [moveInDate, setMoveInDate] = useState(data.move_in_date ?? '')
  const [leaseEndDate, setLeaseEndDate] = useState(data.lease_end_date ?? '')

  const canSubmit = tenantName.trim().length > 0 && !!moveInDate

  function handleSubmit() {
    onSubmit({
      tenant_name: tenantName.trim(),
      tenant_email: tenantEmail.trim() || undefined,
      tenant_phone: tenantPhone.trim() || undefined,
      move_in_date: moveInDate || undefined,
      lease_end_date: leaseEndDate || undefined,
    })
  }

  return (
    <WizardCard
      title="Add your tenant"
      subtitle="We'll create a rent record for this month automatically."
    >
      <WizardBackButton onClick={onBack} />

      <WizardField label="Tenant full name" required>
        <input
          type="text"
          className="wizard-input"
          placeholder="Alex Johnson"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          autoFocus
        />
      </WizardField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WizardField
          label="Email address"
          helper="Used to invite them to the tenant portal later"
        >
          <input
            type="email"
            className="wizard-input"
            placeholder="tenant@email.com"
            value={tenantEmail}
            onChange={(e) => setTenantEmail(e.target.value)}
          />
        </WizardField>

        <WizardField label="Phone number">
          <input
            type="tel"
            className="wizard-input"
            placeholder="+44 7700 900000"
            value={tenantPhone}
            onChange={(e) => setTenantPhone(e.target.value)}
          />
        </WizardField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WizardField label="Move-in date" required>
          <input
            type="date"
            className="wizard-input"
            value={moveInDate}
            onChange={(e) => setMoveInDate(e.target.value)}
          />
        </WizardField>

        <WizardField
          label="Lease end date"
          helper="Leave blank for a rolling tenancy"
        >
          <input
            type="date"
            className="wizard-input"
            value={leaseEndDate}
            onChange={(e) => setLeaseEndDate(e.target.value)}
          />
        </WizardField>
      </div>

      {/* API error */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-200">
          {error}
        </div>
      )}

      <WizardCTA onClick={handleSubmit} disabled={!canSubmit} loading={loading}>
        {loading ? 'Setting up your account...' : 'Finish setup →'}
      </WizardCTA>
    </WizardCard>
  )
}
