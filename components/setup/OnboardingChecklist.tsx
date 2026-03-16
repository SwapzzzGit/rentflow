'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { CheckCircle2, Circle, X } from 'lucide-react'

type CheckItem = {
  id: string
  label: string
  link: string
  done: boolean
}

export function OnboardingChecklist() {
  const supabase = createClient()
  const [items, setItems] = useState<CheckItem[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Check if user dismissed the checklist
      const { data: profile } = await supabase
        .from('profiles')
        .select('checklist_dismissed')
        .eq('id', user.id)
        .single()

      if (profile?.checklist_dismissed) {
        setDismissed(true)
        setLoading(false)
        return
      }

      // Fetch counts in parallel
      const [
        { count: propCount },
        { count: tenantCount },
        { count: portalCount },
        { count: expenseCount },
        { count: paidCount },
      ] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('user_id', user.id).not('portal_user_id', 'is', null),
        supabase.from('expenses').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('rent_payments').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'paid'),
      ])

      setItems([
        { id: 'add_property',  label: 'Add your first property',          link: '/dashboard/properties', done: (propCount ?? 0) > 0 },
        { id: 'add_tenant',    label: 'Add a tenant',                      link: '/dashboard/tenants',    done: (tenantCount ?? 0) > 0 },
        { id: 'invite_tenant', label: 'Invite tenant to their portal',     link: '/dashboard/tenants',    done: (portalCount ?? 0) > 0 },
        { id: 'log_expense',   label: 'Log your first expense',            link: '/dashboard/expenses',   done: (expenseCount ?? 0) > 0 },
        { id: 'mark_rent',     label: 'Mark rent as paid',                 link: '/dashboard/rent',       done: (paidCount ?? 0) > 0 },
      ])
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleDismiss() {
    setDismissed(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ checklist_dismissed: true }).eq('id', user.id)
    }
  }

  if (loading || dismissed) return null

  const allDone = items.length > 0 && items.every((i) => i.done)
  if (allDone) return null

  const doneCount = items.filter((i) => i.done).length

  return (
    <div
      className="mx-4 mt-4 md:mx-8 rounded-2xl p-4 md:p-5 relative"
      style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}
    >
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg transition-all"
        style={{ color: 'var(--dash-muted)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--dash-text)'; e.currentTarget.style.background = 'var(--dash-nav-hover)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--dash-muted)'; e.currentTarget.style.background = 'transparent' }}
        title="Dismiss checklist"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="mb-3 pr-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--dash-muted)' }}>
          Getting started
        </p>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold" style={{ color: 'var(--dash-text)', fontFamily: 'var(--font-bricolage)' }}>
            {doneCount}/{items.length} tasks complete
          </h3>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[120px]" style={{ background: 'var(--dash-nav-hover)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((doneCount / items.length) * 100)}%`, background: '#10b981' }}
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id}>
            {item.done ? (
              <div className="flex items-center gap-2.5 px-1 py-1">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#10b981' }} />
                <span className="text-sm line-through" style={{ color: 'var(--dash-muted)' }}>{item.label}</span>
              </div>
            ) : (
              <Link
                href={item.link}
                className="flex items-center gap-2.5 px-1 py-1 rounded-lg transition-all group"
                style={{ color: 'var(--dash-text)' }}
              >
                <Circle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--dash-muted)' }} />
                <span className="text-sm group-hover:underline underline-offset-2">{item.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
