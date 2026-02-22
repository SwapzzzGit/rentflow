'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Camera, CheckCircle, X, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/status-badge'
import toast from 'react-hot-toast'

type Ticket = {
    id: string; title: string; description: string; category: string
    priority: string; status: string; raised_by: string; created_at: string
    receipt_url: string | null; receipt_amount: number | null
    receipt_category: string | null; cost_bearer: string; landlord_percent: number; tenant_percent: number
    property?: { name: string; currency: string }
    tenant?: { full_name: string }
}

const STEPS = ['open', 'in progress', 'fixed']
const EXPENSE_CATEGORIES = ['Plumbing', 'Electrical', 'Painting', 'Cleaning', 'Insurance', 'General Repair', 'Other']
const priorityColor: Record<string, string> = { high: '#E8392A', medium: '#F59E0B', low: 'var(--dash-muted)' }

export default function MaintenanceDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const supabase = createClient()
    const fileRef = useRef<HTMLInputElement>(null)
    const cameraRef = useRef<HTMLInputElement>(null)

    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [loading, setLoading] = useState(true)
    const [updatingStatus, setUpdatingStatus] = useState(false)

    const [receiptFile, setReceiptFile] = useState<File | null>(null)
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
    const [receiptAmount, setReceiptAmount] = useState('')
    const [receiptCategory, setReceiptCategory] = useState('General Repair')
    const [costBearer, setCostBearer] = useState<'landlord' | 'tenant' | 'split_50' | 'custom'>('landlord')
    const [landlordPct, setLandlordPct] = useState('100')
    const [tenantPct, setTenantPct] = useState('0')
    const [savingReceipt, setSavingReceipt] = useState(false)

    const fetchTicket = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('maintenance_tickets')
            .select('*, property:properties(name, currency), tenant:tenants(full_name)')
            .eq('id', id)
            .single()
        if (error || !data) { setLoading(false); return }
        const t = data as Ticket
        setTicket(t)
        if (t.receipt_amount) setReceiptAmount(t.receipt_amount.toString())
        if (t.receipt_category) setReceiptCategory(t.receipt_category)
        // Generate fresh signed URL from raw path on every load — avoids expired URL bug
        if (t.receipt_url) {
            const isPath = !t.receipt_url.startsWith('http')
            if (isPath) {
                const { data: signed } = await supabase.storage.from('receipts').createSignedUrl(t.receipt_url, 3600)
                setReceiptPreview(signed?.signedUrl || null)
            } else {
                setReceiptPreview(t.receipt_url)
            }
        }
        if (t.cost_bearer) setCostBearer(t.cost_bearer as any)
        if (t.landlord_percent !== undefined) setLandlordPct(t.landlord_percent.toString())
        if (t.tenant_percent !== undefined) setTenantPct(t.tenant_percent.toString())
        setLoading(false)
    }, [id, supabase])

    useEffect(() => { fetchTicket() }, [fetchTicket])

    async function updateStatus(status: string) {
        if (!ticket) return
        setUpdatingStatus(true)
        const { error } = await supabase.from('maintenance_tickets')
            .update({ status, updated_at: new Date().toISOString() }).eq('id', id)
        if (error) { toast.error(error.message); setUpdatingStatus(false); return }
        toast.success(`Status updated to ${status}`)
        setTicket(t => t ? { ...t, status } : null)
        setUpdatingStatus(false)
    }

    function handleFileSelect(file: File | null) {
        if (!file) return
        setReceiptFile(file)
        setReceiptPreview(URL.createObjectURL(file))
    }

    function getCostPercents(): { landlord: number; tenant: number } {
        if (costBearer === 'landlord') return { landlord: 100, tenant: 0 }
        if (costBearer === 'tenant') return { landlord: 0, tenant: 100 }
        if (costBearer === 'split_50') return { landlord: 50, tenant: 50 }
        return { landlord: parseInt(landlordPct) || 0, tenant: parseInt(tenantPct) || 0 }
    }

    async function saveReceipt() {
        if (!receiptAmount) { toast.error('Enter the receipt amount'); return }
        if (costBearer === 'custom') {
            const l = parseInt(landlordPct), t = parseInt(tenantPct)
            if (l + t !== 100) { toast.error('Landlord % + Tenant % must equal 100'); return }
        }
        setSavingReceipt(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { toast.error('Not authenticated'); setSavingReceipt(false); return }

        let receiptUrl = ticket?.receipt_url || null

        if (receiptFile) {
            const ext = receiptFile.name.split('.').pop()
            const uploadPath = `${user.id}/maintenance/${id}/${Date.now()}-receipt.${ext}`
            const { error: uploadError } = await supabase.storage
                .from('receipts').upload(uploadPath, receiptFile, { upsert: true })
            if (uploadError) { toast.error('Failed to upload receipt: ' + uploadError.message); setSavingReceipt(false); return }

            // Store raw path in DB; generate signed URL for preview only
            receiptUrl = uploadPath
            const { data: signed } = await supabase.storage.from('receipts').createSignedUrl(uploadPath, 3600)
            if (signed?.signedUrl) setReceiptPreview(signed.signedUrl)
        }

        const { landlord, tenant: tenantP } = getCostPercents()

        const { error: tkError } = await supabase.from('maintenance_tickets').update({
            receipt_url: receiptUrl, receipt_amount: parseFloat(receiptAmount),
            receipt_category: receiptCategory, cost_bearer: costBearer,
            landlord_percent: landlord, tenant_percent: tenantP,
            updated_at: new Date().toISOString(),
        }).eq('id', id)
        if (tkError) { toast.error(tkError.message); setSavingReceipt(false); return }

        const { data: tkData } = await supabase.from('maintenance_tickets').select('property_id').eq('id', id).single()
        const expensePayload = {
            user_id: user.id, property_id: tkData?.property_id || null, maintenance_ticket_id: id,
            title: ticket?.title || 'Maintenance', amount: parseFloat(receiptAmount),
            category: receiptCategory.toLowerCase(), receipt_url: receiptUrl,
            date: new Date().toISOString().split('T')[0],
            notes: `Cost bearer: ${costBearer}. Landlord: ${landlord}%, Tenant: ${tenantP}%`,
        }

        const { data: existingExp } = await supabase.from('expenses').select('id').eq('maintenance_ticket_id', id).maybeSingle()
        let expError
        if (existingExp?.id) {
            const { error } = await supabase.from('expenses').update(expensePayload).eq('id', existingExp.id)
            expError = error
        } else {
            const { error } = await supabase.from('expenses').insert([expensePayload])
            expError = error
        }
        if (expError) toast.error('Warning: Could not link expense: ' + expError.message)

        toast.success('Receipt saved and added to expenses ✓')
        setSavingReceipt(false)
        fetchTicket()
    }

    const inputStyle = { background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }
    const card = (children: React.ReactNode) => (
        <div className="w-full rounded-2xl p-6" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
            {children}
        </div>
    )

    if (loading) return (
        <div className="w-full max-w-5xl mx-auto px-6 py-6 space-y-6">
            <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: 'var(--dash-card-bg)' }} />
            <div className="h-40 rounded-2xl animate-pulse" style={{ background: 'var(--dash-card-bg)' }} />
            <div className="h-32 rounded-2xl animate-pulse" style={{ background: 'var(--dash-card-bg)' }} />
        </div>
    )

    if (!ticket) return (
        <div className="w-full text-center py-20 text-sm" style={{ color: 'var(--dash-muted)' }}>
            Ticket not found. <button className="underline" onClick={() => router.push('/dashboard/maintenance')}>Go back</button>
        </div>
    )

    return (
        <div className="w-full max-w-5xl mx-auto px-6 py-6 space-y-6">

            {/* Back link */}
            <button onClick={() => router.push('/dashboard/maintenance')} className="flex items-center gap-2 text-sm hover:opacity-80" style={{ color: 'var(--dash-muted)' }}>
                <ArrowLeft className="w-4 h-4" /> Back to Maintenance
            </button>

            {/* ── Header card ── */}
            {card(
                <>
                    <div className="flex items-start gap-3 flex-wrap">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: priorityColor[ticket.priority] || 'var(--dash-muted)' }} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-1">
                                <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>{ticket.title}</h1>
                                <StatusBadge status={ticket.status} variant="maintenance" />
                            </div>
                            {ticket.description && <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>{ticket.description}</p>}
                        </div>
                    </div>
                    {/* 5-column metadata row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mt-5 pt-5" style={{ borderTop: '1px solid var(--dash-divider)' }}>
                        {[
                            { label: 'Property', value: (ticket as any).property?.name || '—' },
                            { label: 'Tenant', value: (ticket as any).tenant?.full_name || '—' },
                            { label: 'Category', value: ticket.category },
                            { label: 'Priority', value: ticket.priority },
                            { label: 'Created', value: new Date(ticket.created_at).toLocaleDateString() },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="font-semibold uppercase tracking-wider mb-1" style={{ fontSize: 10, color: 'var(--dash-muted)' }}>{label}</p>
                                <p className="text-sm capitalize" style={{ color: 'var(--dash-text)' }}>{value}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ── Status Stepper ── */}
            {card(
                <>
                    <h2 className="text-sm font-semibold mb-6" style={{ color: 'var(--dash-text)' }}>Update Status</h2>
                    <div className="flex items-center w-full px-4">
                        {STEPS.map((step, i) => {
                            const active = ticket.status === step
                            const done = STEPS.indexOf(ticket.status) > i
                            return (
                                <div key={step} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center w-20">
                                        <button
                                            onClick={() => !updatingStatus && updateStatus(step)}
                                            className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all border-2 hover:scale-110"
                                            style={{
                                                background: active ? '#E8392A' : done ? 'rgba(34,197,94,0.15)' : 'var(--dash-nav-hover)',
                                                borderColor: active ? '#E8392A' : done ? '#22C55E' : 'var(--dash-border)',
                                                color: active ? '#fff' : done ? '#22C55E' : 'var(--dash-muted)',
                                            }}
                                        >
                                            {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                                        </button>
                                        <p className="text-xs mt-2 capitalize text-center w-full" style={{ color: active ? 'var(--dash-text)' : 'var(--dash-muted)' }}>{step}</p>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className="flex-1 h-px mx-2 mb-5" style={{ background: STEPS.indexOf(ticket.status) > i ? '#22C55E' : 'var(--dash-border)' }} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* ── Bill / Receipt ── */}
            {card(
                <>
                    <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--dash-text)' }}>Bill / Receipt</h2>

                    {!receiptPreview ? (
                        <div className="rounded-xl border-2 border-dashed p-10 text-center mb-5 w-full" style={{ borderColor: 'var(--dash-border)' }}>
                            <Upload className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--dash-muted)' }} />
                            <p className="text-sm mb-4" style={{ color: 'var(--dash-muted)' }}>Upload receipt photo or PDF</p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold" style={{ color: 'var(--dash-text)', background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)' }}>
                                    <Upload className="w-3.5 h-3.5" /> Choose File
                                </button>
                                <button onClick={() => cameraRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold" style={{ color: 'var(--dash-text)', background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)' }}>
                                    <Camera className="w-3.5 h-3.5" /> Take Photo
                                </button>
                            </div>
                            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => handleFileSelect(e.target.files?.[0] || null)} />
                            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileSelect(e.target.files?.[0] || null)} />
                        </div>
                    ) : (
                        <div className="relative w-full h-56 rounded-xl overflow-hidden mb-5" style={{ background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)' }}>
                            {receiptFile?.type === 'application/pdf' || (!receiptFile && receiptPreview?.includes('.pdf')) ? (
                                <div className="flex items-center justify-center h-full gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,57,42,0.1)' }}>
                                        <Upload className="w-5 h-5" style={{ color: '#E8392A' }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--dash-text)' }}>Receipt PDF</p>
                                        <a href={receiptPreview} target="_blank" rel="noreferrer" className="text-xs underline" style={{ color: '#E8392A' }}>View PDF</a>
                                    </div>
                                </div>
                            ) : (
                                <img src={receiptPreview} alt="Receipt" className="w-full h-full object-cover" />
                            )}
                            <button onClick={() => { setReceiptFile(null); setReceiptPreview(null) }} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Amount + Category */}
                    <div className="grid grid-cols-2 gap-4 w-full mb-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Total Amount *</label>
                            <input type="number" placeholder="0.00" value={receiptAmount} onChange={e => setReceiptAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Expense Category</label>
                            <div className="relative w-full">
                                <select value={receiptCategory} onChange={e => setReceiptCategory(e.target.value)} className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl text-sm outline-none" style={inputStyle}>
                                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" style={{ color: 'var(--dash-muted)' }} />
                            </div>
                        </div>
                    </div>

                    {/* Cost bearer */}
                    <div className="space-y-2 mb-4">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Who bears this cost?</label>
                        <div className="grid grid-cols-2 gap-3 w-full">
                            {[
                                { value: 'landlord', label: 'Landlord (100%)' },
                                { value: 'tenant', label: 'Tenant (100%)' },
                                { value: 'split_50', label: 'Split 50 / 50' },
                                { value: 'custom', label: 'Custom split' },
                            ].map(opt => (
                                <button key={opt.value} onClick={() => setCostBearer(opt.value as any)} className="px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all" style={{ background: costBearer === opt.value ? 'rgba(232,57,42,0.12)' : 'var(--dash-nav-hover)', border: `1px solid ${costBearer === opt.value ? '#E8392A' : 'var(--dash-border)'}`, color: costBearer === opt.value ? '#E8392A' : 'var(--dash-text)' }}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {costBearer === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {[['Landlord %', landlordPct, setLandlordPct], ['Tenant %', tenantPct, setTenantPct]].map(([label, val, setter]: any) => (
                                <div key={label as string} className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>{label}</label>
                                    <input type="number" min="0" max="100" value={val} onChange={e => setter(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                                </div>
                            ))}
                        </div>
                    )}

                    <button onClick={saveReceipt} disabled={savingReceipt} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity" style={{ background: '#E8392A' }}>
                        {savingReceipt ? 'Saving...' : 'Save Receipt & Add to Expenses'}
                    </button>
                </>
            )}

            {/* ── Linked Expense banner ── */}
            {ticket.receipt_amount && (
                <div className="w-full rounded-2xl px-6 py-4 flex items-center justify-between" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: '#22C55E' }}>Linked Expense</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--dash-text)' }}>
                            ${Number(ticket.receipt_amount).toLocaleString()} — {ticket.receipt_category} —{' '}
                            {ticket.cost_bearer === 'landlord' ? 'Landlord 100%' : ticket.cost_bearer === 'tenant' ? 'Tenant 100%' : `${ticket.landlord_percent}% / ${ticket.tenant_percent}%`}
                        </p>
                    </div>
                    <button onClick={() => router.push('/dashboard/expenses')} className="text-xs underline hover:opacity-80 flex-shrink-0" style={{ color: 'var(--dash-muted)' }}>
                        View Expenses →
                    </button>
                </div>
            )}

        </div>
    )
}
