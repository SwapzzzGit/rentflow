'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Receipt, Download, Filter, X, Share2, ExternalLink, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SlidePanel } from '@/components/ui/slide-panel'
import { EmptyState } from '@/components/ui/empty-state'
import { CustomSelect } from '@/components/ui/custom-select'
import toast from 'react-hot-toast'

type Expense = {
    id: string; title: string; amount: number; category: string
    date: string; receipt_url: string | null; notes: string | null
    property?: { name: string }
}
type Property = { id: string; name: string }

const CATEGORIES = ['Plumbing', 'Electrical', 'Painting', 'Cleaning', 'Insurance', 'General Repair', 'Utilities', 'Management Fee', 'Legal', 'Other']
const defaultForm = { title: '', amount: '', category: 'General Repair', property_id: '', date: new Date().toISOString().split('T')[0], notes: '' }

// ─── Receipt Viewer Modal ──────────────────────────────────────────────────────
function ReceiptModal({
    expense,
    signedUrl,
    loading,
    error,
    onClose,
    onRetry,
}: {
    expense: Expense
    signedUrl: string | null
    loading: boolean
    error: boolean
    onClose: () => void
    onRetry: () => void
}) {
    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    const isImage = signedUrl ? /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(signedUrl) : false
    const isPDF = signedUrl ? /\.pdf(\?|$)/i.test(signedUrl) : false

    async function handleDownload() {
        if (!signedUrl) return
        const a = document.createElement('a')
        a.href = signedUrl
        a.download = `receipt-${expense.id}`
        a.click()
    }

    async function handleShare() {
        if (!signedUrl) return
        if (navigator.share) {
            try { await navigator.share({ title: 'Receipt', url: signedUrl }) } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(signedUrl)
            toast.success('Link copied!')
        }
    }

    const categoryColors: Record<string, string> = {
        plumbing: '#3B82F6', electrical: '#F59E0B', painting: '#8B5CF6', cleaning: '#22C55E',
        insurance: '#6366F1', utilities: '#14B8A6', 'general repair': '#E8392A', legal: '#EC4899',
        other: '#64748B', 'management fee': '#0EA5E9',
    }
    const catColor = categoryColors[expense.category?.toLowerCase()] || '#64748B'
    const formattedDate = new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    return (
        // Overlay — close on backdrop click
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            {/* Modal card — glassmorphism */}
            <div
                className="relative w-full max-w-lg flex flex-col gap-4 rounded-3xl p-4 shadow-2xl"
                style={{
                    background: 'rgba(255,255,255,0.10)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    animation: 'modalIn 200ms cubic-bezier(0.16,1,0.3,1) both',
                }}
            >
                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-white font-semibold text-base truncate">{expense.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span
                                className="text-xs font-medium rounded-full px-2.5 py-0.5 capitalize"
                                style={{ background: catColor + '33', color: catColor }}
                            >
                                {expense.category}
                            </span>
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{formattedDate}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                        style={{ background: 'rgba(255,255,255,0.15)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* ── Image / PDF Viewer ── */}
                <div
                    className="w-full rounded-2xl overflow-hidden flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.25)', minHeight: '256px' }}
                >
                    {loading && (
                        <div className="flex flex-col items-center gap-3 py-12">
                            <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
                            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading receipt…</p>
                        </div>
                    )}
                    {error && !loading && (
                        <div className="flex flex-col items-center gap-3 py-12">
                            <p className="text-sm text-white/60">Could not load receipt.</p>
                            <button
                                onClick={onRetry}
                                className="text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                                style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
                            >
                                Retry
                            </button>
                        </div>
                    )}
                    {signedUrl && !loading && !error && isImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={signedUrl}
                            alt="Receipt"
                            className="w-full h-auto rounded-2xl object-contain"
                            style={{ maxHeight: '384px' }}
                        />
                    )}
                    {signedUrl && !loading && !error && isPDF && (
                        <iframe
                            src={signedUrl}
                            className="w-full rounded-2xl"
                            style={{ height: '384px', border: 'none' }}
                            title="Receipt PDF"
                        />
                    )}
                    {signedUrl && !loading && !error && !isImage && !isPDF && (
                        <div className="flex flex-col items-center gap-3 py-12">
                            <Receipt className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.4)' }} />
                            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Preview not available for this file type.</p>
                        </div>
                    )}
                </div>

                {/* ── Footer Actions ── */}
                {signedUrl && !loading && !error && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-white transition-colors"
                            style={{ background: 'rgba(255,255,255,0.15)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-white transition-colors"
                            style={{ background: 'rgba(255,255,255,0.15)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                        <button
                            onClick={() => window.open(signedUrl, '_blank')}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-white transition-colors"
                            style={{ background: 'rgba(255,255,255,0.15)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open
                        </button>
                    </div>
                )}

                {/* ── Expense Meta Strip ── */}
                <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    ${Number(expense.amount).toLocaleString()}
                    {(expense as any).property?.name ? ` · ${(expense as any).property.name}` : ''}
                    {` · ${formattedDate}`}
                </p>
            </div>

            {/* Modal entry animation */}
            <style>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.94) translateY(8px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0);   }
                }
            `}</style>
        </div>
    )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
    const supabase = createClient()
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [filterProp, setFilterProp] = useState('')
    const [filterCat, setFilterCat] = useState('')
    const [panelOpen, setPanelOpen] = useState(false)
    const [form, setForm] = useState(defaultForm)
    const [saving, setSaving] = useState(false)

    // Receipt modal state
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
    const [signedUrl, setSignedUrl] = useState<string | null>(null)
    const [modalLoading, setModalLoading] = useState(false)
    const [modalError, setModalError] = useState(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const [{ data: e }, { data: p }] = await Promise.all([
            supabase.from('expenses').select('*, property:properties(name)').eq('user_id', user.id).order('date', { ascending: false }),
            supabase.from('properties').select('id, name').eq('user_id', user.id).order('name'),
        ])
        setExpenses((e || []) as Expense[])
        setProperties((p || []) as Property[])
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchData() }, [fetchData])

    const filtered = expenses.filter(e => {
        const matchProp = !filterProp || (e as any).property?.name === filterProp
        const matchCat = !filterCat || e.category.toLowerCase() === filterCat.toLowerCase()
        return matchProp && matchCat
    })

    // Stats
    const total = filtered.reduce((sum, e) => sum + Number(e.amount), 0)
    const thisMonth = filtered.filter(e => {
        const d = new Date(e.date)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).reduce((sum, e) => sum + Number(e.amount), 0)

    const topCategory = (() => {
        const counts: Record<string, number> = {}
        filtered.forEach(e => { counts[e.category] = (counts[e.category] || 0) + Number(e.amount) })
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
    })()

    async function handleSave() {
        if (!form.title || !form.amount) { toast.error('Title and amount are required'); return }
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { toast.error('Not authenticated'); setSaving(false); return }

        const { error } = await supabase.from('expenses').insert([{ user_id: user.id, title: form.title, amount: parseFloat(form.amount), category: form.category.toLowerCase(), property_id: form.property_id || null, date: form.date, notes: form.notes || null }])
        if (error) { toast.error(error.message); setSaving(false); return }

        toast.success('Expense added')
        setSaving(false); setPanelOpen(false); setForm(defaultForm); fetchData()
    }

    // Opens modal + fetches signed URL
    async function openReceiptModal(expense: Expense) {
        if (!expense.receipt_url) return
        setSelectedExpense(expense)
        setSignedUrl(null)
        setModalError(false)
        setModalLoading(true)
        await fetchSignedUrl(expense.receipt_url)
    }

    async function fetchSignedUrl(path: string) {
        setModalLoading(true)
        setModalError(false)
        const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 3600)
        if (data?.signedUrl) {
            setSignedUrl(data.signedUrl)
        } else {
            setModalError(true)
            toast.error('Could not load receipt')
        }
        setModalLoading(false)
    }

    function closeModal() {
        setSelectedExpense(null)
        setSignedUrl(null)
        setModalError(false)
        setModalLoading(false)
    }

    async function exportPDF() {
        const { default: jsPDF } = await import('jspdf')
        const { default: autoTable } = await import('jspdf-autotable')
        const doc = new jsPDF()
        doc.setFontSize(16)
        doc.text('Expenses Report', 14, 20)
        doc.setFontSize(10)
        doc.text(`Total: $${total.toLocaleString()} | Generated: ${new Date().toLocaleDateString()}`, 14, 30)

        autoTable(doc, {
            startY: 36,
            head: [['Date', 'Title', 'Category', 'Property', 'Amount']],
            body: filtered.map(e => [
                new Date(e.date).toLocaleDateString(),
                e.title,
                e.category,
                (e as any).property?.name || '—',
                `$${Number(e.amount).toLocaleString()}`,
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [232, 57, 42] },
        })

        doc.save('expenses-report.pdf')
        toast.success('PDF exported!')
    }

    const categoryColors: Record<string, string> = {
        plumbing: '#3B82F6', electrical: '#F59E0B', painting: '#8B5CF6', cleaning: '#22C55E',
        insurance: '#6366F1', utilities: '#14B8A6', 'general repair': '#E8392A', legal: '#EC4899', other: '#64748B', 'management fee': '#0EA5E9',
    }

    const inputStyle = { background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }
    const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm outline-none"

    return (
        <div className="p-8 w-full">
            {/* Receipt Viewer Modal */}
            {selectedExpense && (
                <ReceiptModal
                    expense={selectedExpense}
                    signedUrl={signedUrl}
                    loading={modalLoading}
                    error={modalError}
                    onClose={closeModal}
                    onRetry={() => selectedExpense.receipt_url && fetchSignedUrl(selectedExpense.receipt_url)}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>Expenses</h1>
                    <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>{expenses.length} total records</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors" style={{ color: 'var(--dash-text)', background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)' }}>
                        <Download className="w-4 h-4" /> PDF
                    </button>
                    <button onClick={() => { setForm(defaultForm); setPanelOpen(true) }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: '#E8392A' }}>
                        <Plus className="w-4 h-4" /> Add Expense
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total Expenses', value: `$${total.toLocaleString()}` },
                    { label: 'This Month', value: `$${thisMonth.toLocaleString()}` },
                    { label: 'Top Category', value: topCategory },
                ].map(stat => (
                    <div key={stat.label} className="rounded-xl px-5 py-4" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                        <p className="text-xs mb-1" style={{ color: 'var(--dash-muted)' }}>{stat.label}</p>
                        <p className="text-xl font-bold capitalize" style={{ color: 'var(--dash-text)', fontFamily: 'var(--font-bricolage)' }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="min-w-[160px]">
                    <CustomSelect
                        value={filterProp}
                        onChange={setFilterProp}
                        options={properties.map(p => ({ value: p.name, label: p.name }))}
                        placeholder="All Properties"
                    />
                </div>
                <div className="min-w-[170px]">
                    <CustomSelect
                        value={filterCat}
                        onChange={setFilterCat}
                        options={CATEGORIES.map(c => ({ value: c, label: c }))}
                        placeholder="All Categories"
                    />
                </div>
            </div>

            {/* Loading */}
            {loading && <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--dash-card-bg)' }} />)}</div>}

            {/* Empty */}
            {!loading && expenses.length === 0 && (
                <EmptyState icon={Receipt} title="No expenses yet" description="Track your property expenses to get a clear view of your ROI." actionLabel="+ Add Expense" onAction={() => { setForm(defaultForm); setPanelOpen(true) }} />
            )}

            {/* Table */}
            {!loading && expenses.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}>
                    {filtered.length === 0 ? (
                        <p className="text-center py-12 text-sm" style={{ color: 'var(--dash-muted)' }}>No expenses match the selected filters.</p>
                    ) : filtered.map((e, idx) => {
                        const catColor = categoryColors[e.category.toLowerCase()] || '#64748B'
                        return (
                            <div key={e.id} className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--dash-divider)' : 'none' }}>
                                {/* Color dot */}
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: catColor }} />
                                {/* Title + property */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--dash-text)' }}>{e.title}</p>
                                    <p className="text-xs truncate" style={{ color: 'var(--dash-muted)' }}>{(e as any).property?.name || 'Unlinked'}{e.notes ? ` · ${e.notes}` : ''}</p>
                                </div>
                                {/* Category pill */}
                                <span className="hidden md:inline-flex text-xs font-medium rounded-full px-2.5 py-1 flex-shrink-0 capitalize" style={{ background: catColor + '22', color: catColor }}>
                                    {e.category}
                                </span>
                                {/* Date */}
                                <p className="text-xs hidden lg:block w-24 flex-shrink-0" style={{ color: 'var(--dash-muted)' }}>{new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                {/* Amount */}
                                <p className="text-sm font-bold w-20 text-right flex-shrink-0" style={{ color: 'var(--dash-text)' }}>${Number(e.amount).toLocaleString()}</p>
                                {/* Receipt — opens modal */}
                                {e.receipt_url && (
                                    <button
                                        onClick={() => openReceiptModal(e)}
                                        className="text-xs font-medium underline flex-shrink-0 hidden lg:block hover:opacity-70 transition-opacity"
                                        style={{ color: '#E8392A' }}
                                    >
                                        Receipt
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add Panel */}
            <SlidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} title="Add Expense">
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Title *</label>
                        <input className={inputCls} style={inputStyle} placeholder="e.g. Boiler repair" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Amount *</label>
                            <input className={inputCls} style={inputStyle} type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Date</label>
                            <input className={inputCls} style={inputStyle} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                        </div>
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
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Property</label>
                            <CustomSelect
                                value={form.property_id}
                                onChange={v => setForm(f => ({ ...f, property_id: v }))}
                                options={[{ value: '', label: 'None' }, ...properties.map(p => ({ value: p.id, label: p.name }))]}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>Notes (optional)</label>
                        <input className={inputCls} style={inputStyle} placeholder="Any additional notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setPanelOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ color: 'var(--dash-muted)', background: 'var(--dash-nav-hover)', border: '1px solid var(--dash-border)' }}>Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50" style={{ background: '#E8392A' }}>{saving ? 'Saving...' : 'Add Expense'}</button>
                    </div>
                </div>
            </SlidePanel>
        </div>
    )
}
