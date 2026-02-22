'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Building2, MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SlidePanel } from '@/components/ui/slide-panel'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDelete } from '@/components/ui/confirm-delete'
import toast from 'react-hot-toast'

type Property = {
    id: string
    name: string
    address: string
    city: string
    country: string
    property_type: string
    rent_amount: number | null
    currency: string
    status: string
    tenant_count?: number
}

const COUNTRIES = ['United States', 'United Kingdom', 'Australia', 'Canada', 'India', 'UAE', 'Other']
const PROPERTY_TYPES = ['Residential', 'Commercial', 'Apartment', 'House', 'Studio']
const CURRENCIES = ['USD', 'GBP', 'AUD', 'CAD', 'EUR', 'INR', 'AED']
const STATUSES = ['active', 'inactive', 'vacant']
const AVATAR_COLORS = ['#E8392A', '#6366F1', '#22C55E', '#F59E0B', '#3B82F6', '#8B5CF6']

const defaultForm = {
    name: '', address: '', city: '', country: 'United States',
    property_type: 'Residential', rent_amount: '', currency: 'USD', status: 'active',
}

export default function PropertiesPage() {
    const supabase = createClient()
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [panelOpen, setPanelOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(defaultForm)
    const [saving, setSaving] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)

    const fetchProperties = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data, error } = await supabase
            .from('properties')
            .select('*, tenants(count)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) { toast.error('Failed to load properties'); setLoading(false); return }

        const mapped = (data || []).map((p: any) => ({
            ...p,
            tenant_count: p.tenants?.[0]?.count ?? 0,
        }))
        setProperties(mapped)
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchProperties() }, [fetchProperties])

    function openAdd() { setForm(defaultForm); setEditingId(null); setPanelOpen(true) }
    function openEdit(p: Property) {
        setForm({ name: p.name, address: p.address, city: p.city || '', country: p.country || 'United States', property_type: p.property_type || 'Residential', rent_amount: p.rent_amount?.toString() || '', currency: p.currency || 'USD', status: p.status || 'active' })
        setEditingId(p.id)
        setPanelOpen(true)
        setOpenMenuId(null)
    }

    async function handleSave() {
        if (!form.name || !form.address) { toast.error('Name and address are required'); return }
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { toast.error('Not authenticated'); setSaving(false); return }

        const payload = {
            user_id: user.id,
            name: form.name,
            address: form.address,
            city: form.city,
            country: form.country,
            property_type: form.property_type.toLowerCase(),
            rent_amount: form.rent_amount ? parseFloat(form.rent_amount) : null,
            currency: form.currency,
            status: form.status,
            updated_at: new Date().toISOString(),
        }

        const { error } = editingId
            ? await supabase.from('properties').update(payload).eq('id', editingId)
            : await supabase.from('properties').insert({ ...payload })

        if (error) { toast.error(error.message); setSaving(false); return }

        toast.success(editingId ? 'Property updated' : 'Property added')
        setSaving(false)
        setPanelOpen(false)
        fetchProperties()
    }

    async function handleDelete(id: string) {
        setDeletingId(id)
        const { error } = await supabase.from('properties').delete().eq('id', id)
        if (error) { toast.error(error.message); setDeletingId(null); return }
        toast.success('Property deleted')
        setDeleteId(null)
        setDeletingId(null)
        fetchProperties()
    }

    const field = (label: string, node: React.ReactNode) => (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>{label}</label>
            {node}
        </div>
    )

    const input = (name: keyof typeof form, placeholder = '', type = 'text') => (
        <input
            type={type}
            placeholder={placeholder}
            value={form[name]}
            onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{ background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }}
        />
    )

    const select = (name: keyof typeof form, options: string[]) => (
        <select
            value={form[name]}
            onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{ background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }}
        >
            {options.map(o => <option key={o} value={o.toLowerCase().replace(' ', '_') === o.toLowerCase() ? o : o}>{o}</option>)}
        </select>
    )

    return (
        <div className="p-8 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Properties</h1>
                    <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>Manage your rental portfolio</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: '#E8392A' }}
                >
                    <Plus className="w-4 h-4" /> Add Property
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="rounded-2xl h-44 animate-pulse" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }} />
                    ))}
                </div>
            )}

            {/* Empty */}
            {!loading && properties.length === 0 && (
                <EmptyState
                    icon={Building2}
                    title="No properties yet"
                    description="Add your first property to start managing your rental portfolio."
                    actionLabel="+ Add Property"
                    onAction={openAdd}
                />
            )}

            {/* Grid */}
            {!loading && properties.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {properties.map((p, idx) => (
                        <div key={p.id} className="rounded-2xl overflow-hidden relative" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)', borderLeft: '3px solid #E8392A' }}>
                            <div className="p-5">
                                {/* Top row */}
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] + '22' }}>
                                            <Building2 className="w-5 h-5" style={{ color: AVATAR_COLORS[idx % AVATAR_COLORS.length] }} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold leading-tight" style={{ color: 'var(--dash-text)' }}>{p.name}</p>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--dash-muted)' }}>{[p.address, p.city, p.country].filter(Boolean).join(', ')}</p>
                                        </div>
                                    </div>
                                    {/* Three dot menu */}
                                    <div className="relative flex-shrink-0">
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                            style={{ color: 'var(--dash-muted)' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--dash-nav-hover)' }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                        {openMenuId === p.id && (
                                            <div className="absolute right-0 top-8 z-20 rounded-xl shadow-xl overflow-hidden min-w-[120px]" style={{ background: 'var(--dash-sidebar-bg)', border: '1px solid var(--dash-border)' }}>
                                                <button onClick={() => openEdit(p)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors" style={{ color: 'var(--dash-text)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--dash-nav-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                                </button>
                                                <button onClick={() => { setDeleteId(p.id); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors" style={{ color: '#E8392A' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,57,42,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Badges row */}
                                <div className="flex items-center gap-2 flex-wrap mb-4">
                                    <span className="text-xs font-medium rounded-full px-2.5 py-1" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                                        {p.property_type?.charAt(0).toUpperCase() + p.property_type?.slice(1)}
                                    </span>
                                    <StatusBadge status={p.status} />
                                </div>

                                {/* Bottom row */}
                                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--dash-divider)' }}>
                                    <div>
                                        <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>Monthly Rent</p>
                                        <p className="text-base font-bold mt-0.5" style={{ color: 'var(--dash-text)' }}>
                                            {p.rent_amount ? `${p.currency} ${Number(p.rent_amount).toLocaleString()}` : '—'}
                                        </p>
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>{p.tenant_count} tenant{p.tenant_count !== 1 ? 's' : ''}</p>
                                </div>
                            </div>

                            {/* Inline delete confirm */}
                            {deleteId === p.id && (
                                <div className="px-5 pb-5">
                                    <ConfirmDelete
                                        message="Delete this property? This will also remove all associated tenants and data."
                                        onConfirm={() => handleDelete(p.id)}
                                        onCancel={() => setDeleteId(null)}
                                        loading={deletingId === p.id}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Slide Panel */}
            <SlidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} title={editingId ? 'Edit Property' : 'Add Property'}>
                <div className="space-y-5">
                    {field('Property Name *', input('name', 'e.g. Oak Lane Apartment'))}
                    {field('Address *', input('address', 'Street address'))}
                    <div className="grid grid-cols-2 gap-4">
                        {field('City', input('city', 'City'))}
                        {field('Country', select('country', COUNTRIES))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {field('Property Type', select('property_type', PROPERTY_TYPES))}
                        {field('Status', select('status', STATUSES))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {field('Monthly Rent', input('rent_amount', '0.00', 'number'))}
                        {field('Currency', select('currency', CURRENCIES))}
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setPanelOpen(false)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                            style={{ color: 'var(--dash-muted)', background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)' }}
                        >Cancel</button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            style={{ background: '#E8392A' }}
                        >{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Property'}</button>
                    </div>
                </div>
            </SlidePanel>

            {/* Close menu on outside click */}
            {openMenuId && <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />}
        </div>
    )
}
