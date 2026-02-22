'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CustomSelect } from '@/components/ui/custom-select'
import { SlidePanel } from '@/components/ui/slide-panel'
import { Plus, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'

type Ticket = { id: string; title: string; description: string | null; status: string; priority: string; category: string; created_at: string }

const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const CATEGORIES = ['Plumbing', 'Electrical', 'Painting', 'Cleaning', 'HVAC', 'Appliance', 'Structural', 'Other']

const defaultForm = { title: '', description: '', priority: 'medium', category: 'Other' }

function StatusChip({ status }: { status: string }) {
    const map: Record<string, { bg: string; color: string; label: string }> = {
        open: { bg: 'rgba(59,130,246,0.1)', color: '#2563EB', label: 'Open' },
        in_progress: { bg: 'rgba(234,179,8,0.1)', color: '#CA8A04', label: 'In Progress' },
        resolved: { bg: 'rgba(34,197,94,0.1)', color: '#16A34A', label: 'Resolved' },
        closed: { bg: 'rgba(107,114,128,0.1)', color: '#6B7280', label: 'Closed' },
    }
    const s = map[status] ?? map.open
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

function PriorityDot({ priority }: { priority: string }) {
    const colors: Record<string, string> = { low: '#6B7280', medium: '#CA8A04', high: '#EA580C', urgent: '#E8392A' }
    return <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ background: colors[priority] ?? '#6B7280' }} />
}

export default function TenantMaintenancePage() {
    const supabase = createClient()
    const router = useRouter()
    const [tenantId, setTenantId] = useState('')
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [panelOpen, setPanelOpen] = useState(false)
    const [form, setForm] = useState(defaultForm)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/tenant/login'); return }

            const { data: t } = await supabase.from('tenants').select('id').eq('portal_user_id', user.id).single()
            if (!t) { router.push('/tenant/login'); return }

            setTenantId(t.id)

            const { data } = await supabase
                .from('maintenance_tickets')
                .select('id, title, description, status, priority, category, created_at')
                .eq('tenant_id', t.id)
                .order('created_at', { ascending: false })

            setTickets((data || []) as Ticket[])
            setLoading(false)
        }
        load()
    }, [supabase, router])

    async function handleSubmit() {
        if (!form.title) { toast.error('Please enter a title'); return }
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !tenantId) { toast.error('Not authenticated'); setSaving(false); return }

        const { error } = await supabase.from('maintenance_tickets').insert([{
            tenant_id: tenantId,
            user_id: user.id, // will be the tenant's auth uid — landlord RLS handles their own
            title: form.title,
            description: form.description || null,
            priority: form.priority,
            category: form.category,
            status: 'open',
            raised_by: 'tenant',
        }])

        if (error) { toast.error(error.message); setSaving(false); return }
        toast.success('Maintenance request submitted!')
        setSaving(false)
        setPanelOpen(false)
        setForm(defaultForm)
        // Refetch
        const { data } = await supabase.from('maintenance_tickets').select('id, title, description, status, priority, category, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false })
        setTickets((data || []) as Ticket[])
    }

    const inputCls = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/20 focus:border-[#E8392A]"
    const inputStyle = { background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#111' }
    const labelCls = "block text-xs font-semibold uppercase tracking-wider mb-1.5"
    const labelStyle = { color: '#6B7280' }

    if (loading) return (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#F3F4F6' }} />)}</div>
    )

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#111', fontFamily: 'var(--font-bricolage, serif)' }}>Maintenance</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{tickets.length} total requests</p>
                </div>
                <button
                    onClick={() => { setForm(defaultForm); setPanelOpen(true) }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
                    style={{ background: '#E8392A' }}
                >
                    <Plus className="w-4 h-4" /> New Request
                </button>
            </div>

            {tickets.length === 0 ? (
                <div className="rounded-2xl py-16 text-center" style={{ background: 'white', border: '1px solid #E9EBF0' }}>
                    <Wrench className="w-10 h-10 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
                    <p className="text-sm font-medium" style={{ color: '#6B7280' }}>No maintenance requests yet</p>
                    <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Submit a request when something needs attention.</p>
                </div>
            ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E9EBF0' }}>
                    {tickets.map((tk, i) => (
                        <div key={tk.id} className="px-5 py-4 flex items-start justify-between gap-4" style={{ borderBottom: i < tickets.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <p className="text-sm font-semibold truncate" style={{ color: '#111' }}>{tk.title}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-xs" style={{ color: '#9CA3AF' }}>
                                        <PriorityDot priority={tk.priority} />
                                        {tk.priority.charAt(0).toUpperCase() + tk.priority.slice(1)} · {tk.category}
                                    </span>
                                    <span className="text-xs" style={{ color: '#9CA3AF' }}>
                                        {new Date(tk.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                {tk.description && <p className="text-xs mt-1 line-clamp-1" style={{ color: '#9CA3AF' }}>{tk.description}</p>}
                            </div>
                            <StatusChip status={tk.status} />
                        </div>
                    ))}
                </div>
            )}

            {/* Submit panel */}
            <SlidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} title="Submit Maintenance Request">
                <div className="space-y-4">
                    <div>
                        <label className={labelCls} style={labelStyle}>Title *</label>
                        <input className={inputCls} style={inputStyle} placeholder="e.g. Leaking tap in bathroom" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls} style={labelStyle}>Description</label>
                        <textarea className={inputCls} style={{ ...inputStyle, resize: 'none' }} rows={4} placeholder="Describe the issue in detail…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls} style={labelStyle}>Priority</label>
                            <CustomSelect value={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))} options={PRIORITIES.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} />
                        </div>
                        <div>
                            <label className={labelCls} style={labelStyle}>Category</label>
                            <CustomSelect value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={CATEGORIES.map(c => ({ value: c, label: c }))} />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setPanelOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: '#F3F4F6', color: '#374151' }}>Cancel</button>
                        <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#E8392A' }}>
                            {saving ? 'Submitting…' : 'Submit Request'}
                        </button>
                    </div>
                </div>
            </SlidePanel>
        </div>
    )
}
