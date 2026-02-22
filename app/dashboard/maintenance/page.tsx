'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Wrench, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { SlidePanel } from '@/components/ui/slide-panel'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { CustomSelect } from '@/components/ui/custom-select'
import toast from 'react-hot-toast'

type Ticket = {
    id: string; title: string; description: string; category: string
    priority: string; status: string; raised_by: string; created_at: string
    receipt_amount: number | null
    property?: { name: string }; tenant?: { full_name: string }
}
type Property = { id: string; name: string }
type Tenant = { id: string; full_name: string; property_id: string }

const CATEGORIES = ['Plumbing', 'Electrical', 'Painting', 'Structural', 'Appliance', 'General', 'Other']
const PRIORITIES = ['High', 'Medium', 'Low']
const TABS = ['All', 'Open', 'In Progress', 'Fixed']

const priorityColor: Record<string, string> = { high: '#E8392A', medium: '#F59E0B', low: 'var(--dash-muted)' }
const defaultForm = { title: '', description: '', property_id: '', tenant_id: '', category: 'General', priority: 'Medium', raised_by: 'landlord', status: 'open' }

export default function MaintenancePage() {
    const supabase = createClient()
    const router = useRouter()
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [properties, setProperties] = useState<Property[]>([])
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('All')
    const [filterProp, setFilterProp] = useState('')
    const [filterPriority, setFilterPriority] = useState('')
    const [filterRaised, setFilterRaised] = useState('')
    const [panelOpen, setPanelOpen] = useState(false)
    const [form, setForm] = useState(defaultForm)
    const [saving, setSaving] = useState(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const [{ data: tk }, { data: p }, { data: t }] = await Promise.all([
            supabase.from('maintenance_tickets').select('*, property:properties(name), tenant:tenants(full_name)').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('properties').select('id, name').eq('user_id', user.id).order('name'),
            supabase.from('tenants').select('id, full_name, property_id').eq('user_id', user.id).eq('status', 'active'),
        ])
        setTickets((tk || []) as Ticket[])
        setProperties((p || []) as Property[])
        setTenants((t || []) as Tenant[])
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchData() }, [fetchData])

    const filtered = tickets.filter(t => {
        const matchTab = tab === 'All' || t.status.toLowerCase() === tab.toLowerCase()
        const matchProp = !filterProp || (t as any).property?.name === filterProp
        const matchPriority = !filterPriority || t.priority.toLowerCase() === filterPriority
        const matchRaised = !filterRaised || t.raised_by === filterRaised
        return matchTab && matchProp && matchPriority && matchRaised
    })

    const propertyTenants = tenants.filter(t => !form.property_id || t.property_id === form.property_id)

    async function handleSave() {
        if (!form.title || !form.property_id) { toast.error('Title and property are required'); return }
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { toast.error('Not authenticated'); setSaving(false); return }

        const { error } = await supabase.from('maintenance_tickets').insert([{ user_id: user.id, title: form.title, description: form.description, property_id: form.property_id, tenant_id: form.tenant_id || null, category: form.category.toLowerCase(), priority: form.priority.toLowerCase(), raised_by: form.raised_by, status: form.status }])
        if (error) { toast.error(error.message); setSaving(false); return }

        toast.success('Ticket created')
        setSaving(false); setPanelOpen(false); setForm(defaultForm); fetchData()
    }

    const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm outline-none"
    const inputStyle = { background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }

    const propertyOptions = properties.map(p => ({ value: p.name, label: p.name }))
    const propertyFormOptions = properties.map(p => ({ value: p.id, label: p.name }))
    const tenantOptions = [{ value: '', label: 'None' }, ...propertyTenants.map(t => ({ value: t.id, label: t.full_name }))]

    return (
        <div className="p-8 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Maintenance</h1>
                    <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>{tickets.length} total ticket{tickets.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => { setForm(defaultForm); setPanelOpen(true) }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: '#E8392A' }}>
                    <Plus className="w-4 h-4" /> New Ticket
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 rounded-xl p-1 w-fit mb-6" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-lg text-xs font-semibold transition-all" style={{ background: tab === t ? '#E8392A' : 'transparent', color: tab === t ? '#fff' : 'var(--dash-muted)' }}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="min-w-[160px]">
                    <CustomSelect value={filterProp} onChange={setFilterProp} options={propertyOptions} placeholder="All Properties" />
                </div>
                <div className="min-w-[150px]">
                    <CustomSelect
                        value={filterPriority}
                        onChange={setFilterPriority}
                        options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]}
                        placeholder="All Priorities"
                    />
                </div>
                <div className="min-w-[150px]">
                    <CustomSelect
                        value={filterRaised}
                        onChange={setFilterRaised}
                        options={[{ value: 'landlord', label: 'Landlord' }, { value: 'tenant', label: 'Tenant' }]}
                        placeholder="All Raisers"
                    />
                </div>
            </div>

            {/* Loading */}
            {loading && <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--dash-card-bg)' }} />)}</div>}

            {/* Empty */}
            {!loading && tickets.length === 0 && (
                <EmptyState icon={Wrench} title="No maintenance tickets" description="Create your first ticket to track property issues." actionLabel="+ New Ticket" onAction={() => { setForm(defaultForm); setPanelOpen(true) }} />
            )}

            {/* Ticket list */}
            {!loading && tickets.length > 0 && (
                filtered.length === 0
                    ? <p className="text-center py-12 text-sm" style={{ color: 'var(--dash-muted)' }}>No tickets match the selected filters.</p>
                    : <div className="space-y-4">
                        {filtered.map(tk => (
                            <div key={tk.id} className="rounded-2xl p-5 cursor-pointer transition-colors hover:border-[#E8392A]/30" onClick={() => router.push(`/dashboard/maintenance/${tk.id}`)} style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)', borderLeft: `3px solid ${priorityColor[tk.priority] || 'var(--dash-muted)'}` }}>
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <h3 className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>{tk.title}</h3>
                                            <span className="text-xs font-medium rounded-full px-2.5 py-1" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{tk.category}</span>
                                            <span className="text-xs font-medium rounded-full px-2.5 py-1" style={{ background: tk.raised_by === 'tenant' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.07)', color: tk.raised_by === 'tenant' ? '#F59E0B' : 'var(--dash-muted)' }}>
                                                {tk.raised_by === 'tenant' ? 'Tenant' : 'Landlord'}
                                            </span>
                                        </div>
                                        {tk.description && <p className="text-xs mb-2 line-clamp-1" style={{ color: 'var(--dash-muted)' }}>{tk.description}</p>}
                                        <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: 'var(--dash-muted)' }}>
                                            {(tk as any).property?.name && <span>{(tk as any).property.name}</span>}
                                            {(tk as any).tenant?.full_name && <span>· {(tk as any).tenant.full_name}</span>}
                                            <span>· {new Date(tk.created_at).toLocaleDateString()}</span>
                                            {tk.receipt_amount && <span>· 💰 ${Number(tk.receipt_amount).toLocaleString()}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs font-semibold" style={{ color: priorityColor[tk.priority] || 'var(--dash-muted)' }}>{tk.priority?.toUpperCase()}</span>
                                        <StatusBadge status={tk.status} variant="maintenance" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
            )}

            {/* New Ticket Panel */}
            <SlidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} title="New Maintenance Ticket">
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Title *</label>
                        <input className={inputCls} style={inputStyle} placeholder="e.g. Leaking tap in bathroom" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Description</label>
                        <textarea className={inputCls} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Describe the issue in detail..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Property *</label>
                        <CustomSelect
                            value={form.property_id}
                            onChange={v => setForm(f => ({ ...f, property_id: v, tenant_id: '' }))}
                            options={propertyFormOptions}
                            placeholder="Select property..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Tenant (optional)</label>
                        <CustomSelect
                            value={form.tenant_id}
                            onChange={v => setForm(f => ({ ...f, tenant_id: v }))}
                            options={tenantOptions}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Category</label>
                            <CustomSelect
                                value={form.category}
                                onChange={v => setForm(f => ({ ...f, category: v }))}
                                options={CATEGORIES.map(c => ({ value: c, label: c }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Priority</label>
                            <CustomSelect
                                value={form.priority}
                                onChange={v => setForm(f => ({ ...f, priority: v }))}
                                options={PRIORITIES.map(p => ({ value: p, label: p }))}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Raised By</label>
                        <div className="flex gap-4">
                            {['landlord', 'tenant'].map(opt => (
                                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--dash-text)' }}>
                                    <input type="radio" name="raised_by" value={opt} checked={form.raised_by === opt} onChange={() => setForm(f => ({ ...f, raised_by: opt }))} />
                                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Status</label>
                        <CustomSelect
                            value={form.status}
                            onChange={v => setForm(f => ({ ...f, status: v }))}
                            options={[{ value: 'open', label: 'Open' }, { value: 'in progress', label: 'In Progress' }, { value: 'fixed', label: 'Fixed' }]}
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setPanelOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ color: 'var(--dash-muted)', background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)' }}>Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50" style={{ background: '#E8392A' }}>{saving ? 'Saving...' : 'Create Ticket'}</button>
                    </div>
                </div>
            </SlidePanel>
        </div>
    )
}
