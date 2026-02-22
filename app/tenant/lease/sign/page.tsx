'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SignaturePad } from '@/components/ui/signature-pad'
import { CheckCircle2, FileText, Download, AlertCircle, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

type LeaseData = {
    id: string
    status: string
    start_date: string
    end_date: string
    rent_amount: number | null
    document_url: string | null
    landlord_signature: string | null
    landlord_signed_at: string | null
    property?: { name: string; address: string }
    tenant?: { full_name: string }
}

type PageState = 'loading' | 'error' | 'already_signed' | 'not_ready' | 'ready' | 'success'

function SignPageContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [state, setState] = useState<PageState>('loading')
    const [lease, setLease] = useState<LeaseData | null>(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [tenantSig, setTenantSig] = useState<string | null>(null)
    const [agreed, setAgreed] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [downloadingPdf, setDownloadingPdf] = useState(false)

    useEffect(() => {
        if (!token) { setState('error'); setErrorMsg('No signing token provided.'); return }

        async function loadLease() {
            const res = await fetch(`/api/tenant/lease-by-token?token=${token}`)
            if (!res.ok) {
                const d = await res.json().catch(() => ({}))
                setState('error')
                setErrorMsg(d.error || 'Invalid or expired signing link.')
                return
            }
            const data = await res.json()
            setLease(data)
            if (data.status === 'signed') { setState('already_signed'); return }
            if (data.status !== 'pending_tenant') { setState('not_ready'); return }
            setState('ready')
        }
        loadLease()
    }, [token])

    async function handleSign() {
        if (!tenantSig) { toast.error('Please save your signature first'); return }
        if (!agreed) { toast.error('Please agree to the terms before signing'); return }
        setSubmitting(true)
        try {
            const res = await fetch('/api/leases/tenant-sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, signature: tenantSig }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setState('success')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDownloadPdf() {
        if (!lease) return
        setDownloadingPdf(true)
        try {
            const res = await fetch(`/api/leases/signed-pdf?leaseId=${lease.id}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            window.open(data.url, '_blank')
        } catch (err: any) {
            toast.error('Could not load PDF: ' + err.message)
        } finally {
            setDownloadingPdf(false)
        }
    }

    const fmt = (d: string | null) => d
        ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
        : '—'

    // ── Loading ──────────────────────────────────────────────────────────────
    if (state === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F8FA' }}>
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 rounded-full border-2 border-t-red-500 animate-spin mx-auto" style={{ borderColor: '#E9EBF0', borderTopColor: '#E8392A' }} />
                    <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading lease…</p>
                </div>
            </div>
        )
    }

    // ── Success ──────────────────────────────────────────────────────────────
    if (state === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)' }}>
                <div className="max-w-md w-full text-center space-y-6">
                    <div
                        className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
                        style={{ background: 'rgba(22,163,74,0.12)', animation: 'pulse 2s infinite' }}
                    >
                        <CheckCircle2 className="w-12 h-12" style={{ color: '#16A34A' }} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold mb-2" style={{ color: '#111', fontFamily: 'serif' }}>
                            Lease Signed Successfully!
                        </h1>
                        <p className="text-base" style={{ color: '#6B7280' }}>
                            A copy of the signed lease has been emailed to you. Both parties now have a fully executed agreement.
                        </p>
                    </div>
                    <div className="rounded-2xl p-5 space-y-2" style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)' }}>
                        <p className="text-sm font-semibold" style={{ color: '#16A34A' }}>✓ Digitally signed</p>
                        <p className="text-sm font-semibold" style={{ color: '#16A34A' }}>✓ PDF sent to your email</p>
                        <p className="text-sm font-semibold" style={{ color: '#16A34A' }}>✓ Landlord notified</p>
                    </div>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={downloadingPdf}
                        className="w-full py-3 rounded-2xl font-semibold text-white hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ background: '#16A34A' }}
                    >
                        <Download className="w-4 h-4" />
                        {downloadingPdf ? 'Loading PDF…' : 'Download Signed PDF'}
                    </button>
                    <a href="/tenant/lease" className="block text-sm underline" style={{ color: '#E8392A' }}>
                        Go to my tenant portal →
                    </a>
                </div>
            </div>
        )
    }

    // ── Error / Already signed / Not ready ──────────────────────────────────
    if (state === 'error' || state === 'already_signed' || state === 'not_ready') {
        const icon = state === 'already_signed' ? <CheckCircle2 className="w-10 h-10" style={{ color: '#16A34A' }} /> : <AlertCircle className="w-10 h-10" style={{ color: '#E8392A' }} />
        const title = state === 'already_signed' ? 'Already Signed' : state === 'not_ready' ? 'Not Ready for Signing' : 'Invalid Link'
        const msg = state === 'already_signed'
            ? 'You have already signed this lease. Thank you! A copy was sent to your email.'
            : state === 'not_ready'
                ? 'This lease is not ready for your signature yet. Please wait for your landlord to sign first.'
                : (errorMsg || 'This signing link is invalid or has expired.')

        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F6F8FA' }}>
                <div className="max-w-md w-full text-center rounded-3xl p-10 space-y-4" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <div className="flex justify-center">{icon}</div>
                    <h2 className="text-xl font-bold" style={{ color: '#111' }}>{title}</h2>
                    <p className="text-sm" style={{ color: '#6B7280' }}>{msg}</p>
                    {state === 'already_signed' && (
                        <a href="/tenant/lease" className="inline-block mt-2 text-sm underline" style={{ color: '#E8392A' }}>View my lease →</a>
                    )}
                </div>
            </div>
        )
    }

    // ── Signing Page ─────────────────────────────────────────────────────────
    const property = (lease as any)?.property
    const tenant = (lease as any)?.tenant

    return (
        <div className="min-h-screen" style={{ background: '#F6F8FA' }}>
            {/* Header */}
            <div style={{ background: 'white', borderBottom: '1px solid #E9EBF0' }}>
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#E8392A' }}>
                        <span className="text-white font-bold text-sm">R</span>
                    </div>
                    <div>
                        <span className="font-bold text-base" style={{ color: '#111' }}>RentFlow</span>
                        <span className="ml-2 text-sm" style={{ color: '#9CA3AF' }}>· Lease Signing</span>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
                {/* Property header card */}
                <div className="rounded-3xl p-6" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #E9EBF0' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>Lease Agreement</p>
                    <h1 className="text-2xl font-bold mb-1" style={{ color: '#111', fontFamily: 'serif' }}>
                        {property?.name || 'Your Lease'}
                    </h1>
                    {property?.address && <p className="text-sm mb-3" style={{ color: '#6B7280' }}>{property.address}</p>}
                    <div className="flex flex-wrap gap-4 text-sm" style={{ color: '#6B7280' }}>
                        <span>📅 {fmt(lease?.start_date || null)} — {fmt(lease?.end_date || null)}</span>
                        {lease?.rent_amount && <span>💰 ${Number(lease.rent_amount).toLocaleString()}/mo</span>}
                    </div>
                </div>

                {/* Lease Summary */}
                <div className="rounded-3xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #E9EBF0' }}>
                    <p className="text-sm font-bold mb-4" style={{ color: '#111' }}>Lease Summary</p>
                    {[
                        { label: 'Property', value: property?.name || '—' },
                        { label: 'Address', value: property?.address || '—' },
                        { label: 'Tenant', value: tenant?.full_name || '—' },
                        { label: 'Monthly Rent', value: lease?.rent_amount ? `$${Number(lease.rent_amount).toLocaleString()}` : '—' },
                        { label: 'Start Date', value: fmt(lease?.start_date || null) },
                        { label: 'End Date', value: fmt(lease?.end_date || null) },
                    ].map(row => (
                        <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <span className="text-sm" style={{ color: '#6B7280' }}>{row.label}</span>
                            <span className="text-sm font-medium" style={{ color: '#111' }}>{row.value}</span>
                        </div>
                    ))}
                    {lease?.document_url && (
                        <a
                            href={lease.document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 mt-4 text-sm font-semibold"
                            style={{ color: '#E8392A' }}
                        >
                            <FileText className="w-4 h-4" />
                            View Full Lease Document
                        </a>
                    )}
                </div>

                {/* Landlord Signature Preview */}
                {lease?.landlord_signature && (
                    <div className="rounded-3xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #E9EBF0' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#16A34A' }} />
                            <p className="text-sm font-bold" style={{ color: '#111' }}>Landlord Has Signed</p>
                        </div>
                        <div className="rounded-2xl p-4 flex items-center justify-center" style={{ background: '#F9FAFB', border: '1px solid #E9EBF0', minHeight: '80px' }}>
                            <img src={lease.landlord_signature} alt="Landlord signature" className="max-h-20 object-contain" />
                        </div>
                        {lease.landlord_signed_at && (
                            <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                                Signed on {fmt(lease.landlord_signed_at)}
                            </p>
                        )}
                    </div>
                )}

                {/* Tenant Signature */}
                <div className="rounded-3xl p-6" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #E9EBF0' }}>
                    <h2 className="text-base font-bold mb-1" style={{ color: '#111' }}>Your Signature</h2>
                    <p className="text-sm mb-5" style={{ color: '#6B7280' }}>Draw your signature below to complete the lease agreement.</p>
                    <SignaturePad
                        label="Sign here"
                        onSave={(base64) => setTenantSig(base64)}
                        onClear={() => setTenantSig(null)}
                    />

                    {/* Consent checkbox */}
                    <label className="flex items-start gap-3 mt-5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={e => setAgreed(e.target.checked)}
                            className="mt-0.5 w-4 h-4 flex-shrink-0 rounded"
                            style={{ accentColor: '#E8392A' }}
                        />
                        <span className="text-sm" style={{ color: '#374151' }}>
                            I agree to the terms of this lease agreement and confirm my signature above is legally binding. I understand that electronic signatures have the same legal effect as a handwritten signature.
                        </span>
                    </label>

                    {/* Submit button */}
                    <button
                        onClick={handleSign}
                        disabled={!tenantSig || !agreed || submitting}
                        className="w-full mt-5 py-3.5 rounded-2xl font-semibold text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        style={{ background: '#E8392A' }}
                    >
                        {submitting ? 'Signing…' : 'Sign Lease Agreement'}
                    </button>

                    {/* Legal disclaimer */}
                    <div className="mt-4 flex items-start gap-2">
                        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#9CA3AF' }} />
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>
                            This electronic signature is legally binding under the Electronic Signatures in Global and National Commerce Act (E-SIGN) and applicable state laws. By clicking &quot;Sign Lease Agreement&quot;, you consent to using an electronic signature.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function TenantSignPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F8FA' }}>
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: '#E9EBF0', borderTopColor: '#E8392A' }} />
                    <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading lease…</p>
                </div>
            </div>
        }>
            <SignPageContent />
        </Suspense>
    )
}
