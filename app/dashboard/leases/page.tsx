'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, FileText, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { SlidePanel } from '@/components/ui/slide-panel'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { CustomSelect } from '@/components/ui/custom-select'
import toast from 'react-hot-toast'

type Lease = {
    id: string; start_date: string; end_date: string; rent_amount: number | null
    status: string; document_url: string | null; notes: string | null
    property?: { name: string }; tenant?: { full_name: string; avatar_color: string }
}
type Property = { id: string; name: string }
type Tenant = { id: string; full_name: string; property_id: string; avatar_color: string }

const defaultForm = { property_id: '', tenant_id: '', start_date: '', end_date: '', rent_amount: '', status: 'active', notes: '' }

export default function LeasesPage() {
    const supabase = createClient()
    const router = useRouter()
    const [leases, setLeases] = useState<Lease[]>([])
    const [properties, setProperties] = useState<Property[]>([])
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [loading, setLoading] = useState(true)
    const [panelOpen, setPanelOpen] = useState(false)
    const [form, setForm] = useState(defaultForm)
    const [saving, setSaving] = useState(false)
    const [uploadFile, setUploadFile] = useState<File | null>(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const [{ data: l }, { data: p }, { data: t }] = await Promise.all([
            supabase.from('leases').select('*, property:properties(name), tenant:tenants(full_name, avatar_color)').eq('user_id', user.id).order('end_date', { ascending: true }),
            supabase.from('properties').select('id, name').eq('user_id', user.id).order('name'),
            supabase.from('tenants').select('id, full_name, property_id, avatar_color').eq('user_id', user.id).eq('status', 'active'),
        ])
        setLeases((l || []) as Lease[])
        setProperties((p || []) as Property[])
        setTenants((t || []) as Tenant[])
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchData() }, [fetchData])

    const expiringSoon = leases.filter(l => {
        const days = Math.ceil((new Date(l.end_date).getTime() - Date.now()) / 86400000)
        return days >= 0 && days <= 60 && l.status === 'active'
    })

    const propertyTenants = tenants.filter(t => !form.property_id || t.property_id === form.property_id)

    async function handleSave() {
        if (!form.property_id || !form.tenant_id || !form.start_date || !form.end_date) {
            toast.error('Property, tenant, and lease dates are required'); return
        }
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { toast.error('Not authenticated'); setSaving(false); return }

        let documentUrl: string | null = null

        if (uploadFile) {
            const ext = uploadFile.name.split('.').pop()
            const timestamp = Date.now()
            const path = `${user.id}/leases/${timestamp}-lease.${ext}`
            const { error: upErr } = await supabase.storage.from('lease-documents').upload(path, uploadFile)
            if (upErr) { toast.error('Failed to upload lease document: ' + upErr.message); setSaving(false); return }
            const { data: urlData } = supabase.storage.from('lease-documents').getPublicUrl(path)
            documentUrl = urlData.publicUrl
        }

        const { error } = await supabase.from('leases').insert([{
            user_id: user.id, property_id: form.property_id, tenant_id: form.tenant_id,
            start_date: form.start_date, end_date: form.end_date,
            rent_amount: form.rent_amount ? parseFloat(form.rent_amount) : null,
            status: form.status, document_url: documentUrl, notes: form.notes || null,
        }])

        if (error) { toast.error(error.message); setSaving(false); return }
        toast.success('Lease added')
        setSaving(false); setPanelOpen(false); setForm(defaultForm); setUploadFile(null); fetchData()
    }

    const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const daysLeft = (endDate: string) => Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
    const daysColor = (days: number) => {
        if (days < 0) return '#64748B'
        if (days < 30) return '#E8392A'
        if (days < 60) return '#F59E0B'
        return 'var(--dash-badge-paid-text)'
    }

    const inputStyle = { background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }
    const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm outline-none"

    const propertyOptions = properties.map(p => ({ value: p.id, label: p.name }))
    const tenantOptions = propertyTenants.map(t => ({ value: t.id, label: t.full_name }))

    return (
        <div className="p-8 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Leases</h1>
                    <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>{leases.length} total lease{leases.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => { setForm(defaultForm); setUploadFile(null); setPanelOpen(true) }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: '#E8392A' }}>
                    <Plus className="w-4 h-4" /> Add Lease
                </button>
            </div>

            {/* Expiry alert banner */}
            {expiringSoon.length > 0 && (
                <div className="rounded-2xl p-4 mb-6 flex items-start gap-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                    <div>
                        <p className="text-sm font-semibold mb-1" style={{ color: '#F59E0B' }}>Leases expiring soon ({expiringSoon.length})</p>
                        <div className="flex flex-wrap gap-2">
                            {expiringSoon.map(l => {
                                const days = daysLeft(l.end_date)
                                return (
                                    <span key={l.id} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                                        {(l as any).tenant?.full_name || '—'} — {days}d left
                                    </span>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--dash-card-bg)' }} />)}</div>}

            {/* Empty */}
            {!loading && leases.length === 0 && (
                <EmptyState icon={FileText} title="No leases yet" description="Add your first lease to track agreements and expiry dates." actionLabel="+ Add Lease" onAction={() => { setForm(defaultForm); setPanelOpen(true) }} />
            )}

            {/* Lease list */}
            {!loading && leases.length > 0 && (
                <div className="space-y-4">
                    {leases.map(l => {
                        const days = daysLeft(l.end_date)
                        const isPast = days < 0
                        return (
                            <div key={l.id} className="rounded-2xl p-5" style={{ background: 'var(--dash-card-bg)', border: `1px solid ${isPast ? 'var(--dash-card-border)' : days < 30 ? 'rgba(232,57,42,0.25)' : days < 60 ? 'rgba(245,158,11,0.25)' : 'var(--dash-card-border)'}` }}>
                                <div className="flex items-start gap-4 flex-wrap">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: (l as any).tenant?.avatar_color || '#E8392A' }}>
                                        {initials((l as any).tenant?.full_name || '?')}
                                    </div>
                                    {/* Main info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <p className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>{(l as any).tenant?.full_name || '—'}</p>
                                            <StatusBadge status={l.status} />
                                        </div>
                                        <p className="text-xs mb-2" style={{ color: 'var(--dash-muted)' }}>{(l as any).property?.name || '—'}</p>
                                        <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--dash-muted)' }}>
                                            <span>Start: {new Date(l.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            <span>End: {new Date(l.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            {l.rent_amount && <span>Rent: ${Number(l.rent_amount).toLocaleString()}/mo</span>}
                                        </div>
                                    </div>
                                    {/* Days remaining */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xl font-bold" style={{ color: daysColor(days), fontFamily: 'var(--font-bricolage)' }}>
                                            {isPast ? 'Expired' : `${days}d`}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>{isPast ? `${Math.abs(days)} days ago` : 'remaining'}</p>
                                        {l.document_url && (
                                            <a href={l.document_url} target="_blank" rel="noreferrer" className="text-xs underline block mt-1" style={{ color: '#E8392A' }}>
                                                View Lease
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add Lease Panel */}
            <SlidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} title="Add Lease">
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Property *</label>
                        <CustomSelect
                            value={form.property_id}
                            onChange={v => setForm(f => ({ ...f, property_id: v, tenant_id: '' }))}
                            options={propertyOptions}
                            placeholder="Select property..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Tenant *</label>
                        <CustomSelect
                            value={form.tenant_id}
                            onChange={v => setForm(f => ({ ...f, tenant_id: v }))}
                            options={tenantOptions}
                            placeholder="Select tenant..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Start Date *</label>
                            <input className={inputCls} style={inputStyle} type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>End Date *</label>
                            <input className={inputCls} style={inputStyle} type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Monthly Rent</label>
                            <input className={inputCls} style={inputStyle} type="number" placeholder="0.00" value={form.rent_amount} onChange={e => setForm(f => ({ ...f, rent_amount: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Status</label>
                            <CustomSelect
                                value={form.status}
                                onChange={v => setForm(f => ({ ...f, status: v }))}
                                options={[{ value: 'active', label: 'Active' }, { value: 'expired', label: 'Expired' }, { value: 'renewed', label: 'Renewed' }]}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Upload Lease Document (optional)</label>
                        <div className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl" style={inputStyle}>
                            <label className="cursor-pointer text-xs font-semibold flex items-center gap-2 flex-1" style={{ color: 'var(--dash-muted)' }}>
                                <FileText className="w-4 h-4" />
                                {uploadFile ? uploadFile.name : 'Choose PDF or image...'}
                                <input type="file" accept=".pdf,image/*" className="hidden" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                            </label>
                            {uploadFile && <button onClick={() => setUploadFile(null)} className="text-xs" style={{ color: '#E8392A' }}>Remove</button>}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Notes</label>
                        <input className={inputCls} style={inputStyle} placeholder="Optional notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setPanelOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ color: 'var(--dash-muted)', background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)' }}>Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50" style={{ background: '#E8392A' }}>{saving ? 'Saving...' : 'Add Lease'}</button>
                    </div>
                </div>
            </SlidePanel>
        </div>
    )
}
