'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Users, Search, Eye, Edit2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { SlidePanel } from '@/components/ui/slide-panel'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDelete } from '@/components/ui/confirm-delete'
import toast from 'react-hot-toast'

type Tenant = {
    id: string
    full_name: string
    email: string
    phone: string
    property_id: string
    rent_amount: number | null
    lease_start: string
    lease_end: string
    status: string
    avatar_color: string
    property?: { id: string; name: string }
}

type Property = { id: string; name: string; rent_amount: number | null }

const AVATAR_COLORS = ['#E8392A', '#6366F1', '#22C55E', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899']
const defaultForm = { full_name: '', email: '', phone: '', property_id: '', rent_amount: '', lease_start: '', lease_end: '', status: 'active' }

export default function TenantsPage() {
    const supabase = createClient()
    const router = useRouter()
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterProperty, setFilterProperty] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [panelOpen, setPanelOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(defaultForm)
    const [saving, setSaving] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const [{ data: t }, { data: p }] = await Promise.all([
            supabase.from('tenants').select('*, property:properties(id, name)').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('properties').select('id, name, rent_amount').eq('user_id', user.id).order('name'),
        ])
        setTenants((t || []) as Tenant[])
        setProperties((p || []) as Property[])
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchData() }, [fetchData])

    // Auto-fill rent from selected property
    useEffect(() => {
        if (form.property_id && !editingId) {
            const prop = properties.find(p => p.id === form.property_id)
            if (prop?.rent_amount) setForm(f => ({ ...f, rent_amount: prop.rent_amount!.toString() }))
        }
    }, [form.property_id])

    const filtered = tenants.filter(t => {
        const matchSearch = !search || t.full_name.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase())
        const matchProp = !filterProperty || t.property_id === filterProperty
        const matchStatus = !filterStatus || t.status === filterStatus
        return matchSearch && matchProp && matchStatus
    })

    function openAdd() { setForm(defaultForm); setEditingId(null); setPanelOpen(true) }
    function openEdit(t: Tenant) {
        setForm({ full_name: t.full_name, email: t.email || '', phone: t.phone || '', property_id: t.property_id, rent_amount: t.rent_amount?.toString() || '', lease_start: t.lease_start || '', lease_end: t.lease_end || '', status: t.status })
        setEditingId(t.id)
        setPanelOpen(true)
    }

    async function handleSave() {
        if (!form.full_name || !form.property_id || !form.lease_start || !form.lease_end) { toast.error('Name, property, and lease dates are required'); return }
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { toast.error('Not authenticated'); setSaving(false); return }

        const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
        const payload = { user_id: user.id, full_name: form.full_name, email: form.email, phone: form.phone, property_id: form.property_id, rent_amount: form.rent_amount ? parseFloat(form.rent_amount) : null, lease_start: form.lease_start, lease_end: form.lease_end, status: form.status, avatar_color: editingId ? undefined : color, updated_at: new Date().toISOString() }

        const { error } = editingId
            ? await supabase.from('tenants').update(payload).eq('id', editingId)
            : await supabase.from('tenants').insert([{ ...payload, avatar_color: color }])

        if (error) { toast.error(error.message); setSaving(false); return }
        toast.success(editingId ? 'Tenant updated' : 'Tenant added')
        setSaving(false); setPanelOpen(false); fetchData()
    }

    async function handleDelete(id: string) {
        setDeletingId(id)
        const { error } = await supabase.from('tenants').delete().eq('id', id)
        if (error) { toast.error(error.message); setDeletingId(null); return }
        toast.success('Tenant deleted')
        setDeleteId(null); setDeletingId(null); fetchData()
    }

    const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm outline-none"
    const inputStyle = { background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }
    const fieldLabel = (label: string) => <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>{label}</label>

    return (
        <div className="p-8 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Tenants</h1>
                    <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>{tenants.length} total tenant{tenants.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: '#E8392A' }}>
                    <Plus className="w-4 h-4" /> Add Tenant
                </button>
            </div>

            {/* Filters bar */}
            <div className="rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                <div className="flex items-center gap-2 flex-1 min-w-[180px] px-3 py-2 rounded-lg" style={{ background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)' }}>
                    <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--dash-muted)' }} />
                    <input type="text" placeholder="Search tenants..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: 'var(--dash-text)' }} />
                </div>
                <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }}>
                    <option value="">All Properties</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }}>
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {/* Loading */}
            {loading && <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--dash-card-bg)' }} />)}</div>}

            {/* Empty */}
            {!loading && tenants.length === 0 && (
                <EmptyState icon={Users} title="No tenants yet" description="Add your first tenant and link them to a property." actionLabel="+ Add Tenant" onAction={openAdd} />
            )}

            {/* Table */}
            {!loading && tenants.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                    {filtered.length === 0 ? (
                        <p className="text-center py-12 text-sm" style={{ color: 'var(--dash-muted)' }}>No tenants match your search.</p>
                    ) : (
                        filtered.map((t, idx) => {
                            const daysLeft = t.lease_end ? Math.ceil((new Date(t.lease_end).getTime() - Date.now()) / 86400000) : null
                            return (
                                <div key={t.id}>
                                    <div
                                        className="dash-row flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors"
                                        style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--dash-divider)' : 'none' }}
                                        onClick={() => router.push(`/dashboard/tenants/${t.id}`)}
                                    >
                                        {/* Avatar + name */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: t.avatar_color || '#E8392A' }}>
                                                {initials(t.full_name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--dash-text)' }}>{t.full_name}</p>
                                                <p className="text-xs truncate" style={{ color: 'var(--dash-muted)' }}>{t.email || '—'}</p>
                                            </div>
                                        </div>
                                        {/* Property */}
                                        <div className="hidden md:block w-36 flex-shrink-0">
                                            <p className="text-xs truncate" style={{ color: 'var(--dash-muted)' }}>{(t as any).property?.name || '—'}</p>
                                        </div>
                                        {/* Rent */}
                                        <div className="hidden lg:block w-24 flex-shrink-0">
                                            <p className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>{t.rent_amount ? `$${Number(t.rent_amount).toLocaleString()}` : '—'}</p>
                                        </div>
                                        {/* Lease end */}
                                        <div className="hidden lg:block w-28 flex-shrink-0">
                                            <p className="text-xs" style={{ color: daysLeft !== null && daysLeft < 30 ? '#E8392A' : daysLeft !== null && daysLeft < 60 ? '#F59E0B' : 'var(--dash-muted)' }}>
                                                {t.lease_end ? new Date(t.lease_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                            </p>
                                        </div>
                                        {/* Status */}
                                        <div className="flex-shrink-0">
                                            <StatusBadge status={t.status} />
                                        </div>
                                        {/* Actions */}
                                        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => router.push(`/dashboard/tenants/${t.id}`)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" title="View" style={{ color: 'var(--dash-muted)' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--dash-nav-hover)'; e.currentTarget.style.color = 'var(--dash-text)' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--dash-muted)' }}>
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => openEdit(t)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" title="Edit" style={{ color: 'var(--dash-muted)' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--dash-nav-hover)'; e.currentTarget.style.color = 'var(--dash-text)' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--dash-muted)' }}>
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => setDeleteId(t.id)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" title="Delete" style={{ color: 'var(--dash-muted)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,57,42,0.08)'; e.currentTarget.style.color = '#E8392A' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--dash-muted)' }}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    {deleteId === t.id && (
                                        <div className="px-6 pb-4">
                                            <ConfirmDelete onConfirm={() => handleDelete(t.id)} onCancel={() => setDeleteId(null)} loading={deletingId === t.id} />
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Add/Edit Panel */}
            <SlidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} title={editingId ? 'Edit Tenant' : 'Add Tenant'}>
                <div className="space-y-5">
                    <div className="space-y-1.5">{fieldLabel('Full Name *')}<input className={inputCls} style={inputStyle} placeholder="Full Name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">{fieldLabel('Email')}<input className={inputCls} style={inputStyle} type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                        <div className="space-y-1.5">{fieldLabel('Phone')}<input className={inputCls} style={inputStyle} type="tel" placeholder="+1 555..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                    </div>
                    <div className="space-y-1.5">
                        {fieldLabel('Property *')}
                        <select className={inputCls} style={inputStyle} value={form.property_id} onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))}>
                            <option value="">Select property...</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">{fieldLabel('Monthly Rent')}<input className={inputCls} style={inputStyle} type="number" placeholder="0.00" value={form.rent_amount} onChange={e => setForm(f => ({ ...f, rent_amount: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">{fieldLabel('Lease Start *')}<input className={inputCls} style={inputStyle} type="date" value={form.lease_start} onChange={e => setForm(f => ({ ...f, lease_start: e.target.value }))} /></div>
                        <div className="space-y-1.5">{fieldLabel('Lease End *')}<input className={inputCls} style={inputStyle} type="date" value={form.lease_end} onChange={e => setForm(f => ({ ...f, lease_end: e.target.value }))} /></div>
                    </div>
                    <div className="space-y-1.5">
                        {fieldLabel('Status')}
                        <select className={inputCls} style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setPanelOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ color: 'var(--dash-muted)', background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)' }}>Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50" style={{ background: '#E8392A' }}>{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Tenant'}</button>
                    </div>
                </div>
            </SlidePanel>
        </div>
    )
}
