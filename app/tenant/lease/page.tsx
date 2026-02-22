'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, ExternalLink, Calendar, DollarSign, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

type Lease = {
    id: string
    start_date: string
    end_date: string
    rent_amount: number
    document_url?: string | null
    property?: { name: string; address: string }
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
            <span className="text-sm" style={{ color: '#6B7280' }}>{label}</span>
            <span className="text-sm font-semibold" style={{ color: highlight ? '#E8392A' : '#111' }}>{value}</span>
        </div>
    )
}

export default function TenantLeasePage() {
    const supabase = createClient()
    const router = useRouter()
    const [lease, setLease] = useState<Lease | null>(null)
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/tenant/login'); return }

            const { data: t } = await supabase.from('tenants').select('id').eq('portal_user_id', user.id).single()
            if (!t) { router.push('/tenant/login'); return }

            const { data } = await supabase
                .from('leases')
                .select('id, start_date, end_date, rent_amount, document_url, property:properties(name, address)')
                .eq('tenant_id', t.id)
                .order('end_date', { ascending: false })
                .limit(1)
                .single()

            if (data) setLease(data as unknown as Lease)
            setLoading(false)
        }
        load()
    }, [supabase, router])

    async function downloadDoc() {
        if (!lease?.document_url) return
        setDownloading(true)
        try {
            const { data, error } = await supabase.storage.from('lease-documents').createSignedUrl(lease.document_url, 3600)
            if (error || !data?.signedUrl) { toast.error('Could not load document'); return }
            const a = document.createElement('a')
            a.href = data.signedUrl
            a.download = `lease-${lease.id}`
            a.click()
            toast.success('Download started!')
        } finally {
            setDownloading(false)
        }
    }

    if (loading) return (
        <div className="space-y-4">
            <div className="h-8 w-32 rounded-lg animate-pulse" style={{ background: '#F3F4F6' }} />
            <div className="h-64 rounded-2xl animate-pulse" style={{ background: '#F3F4F6' }} />
        </div>
    )

    if (!lease) return (
        <div className="rounded-2xl py-20 text-center" style={{ background: 'white', border: '1px solid #E9EBF0' }}>
            <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
            <p className="text-sm font-medium" style={{ color: '#6B7280' }}>No active lease found</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Your landlord hasn&apos;t added a lease yet.</p>
        </div>
    )

    const daysLeft = Math.ceil((new Date(lease.end_date).getTime() - Date.now()) / 86400000)
    const isExpiring = daysLeft < 60
    const isExpired = daysLeft < 0
    const prop = (lease as any).property

    const daysLabel = isExpired ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft} days remaining`

    return (
        <div className="space-y-5">
            <h1 className="text-xl font-bold" style={{ color: '#111', fontFamily: 'var(--font-bricolage, serif)' }}>Your Lease</h1>

            {/* Status banner */}
            <div className={`rounded-2xl px-5 py-4 flex items-center gap-3`} style={{
                background: isExpired ? 'rgba(232,57,42,0.06)' : isExpiring ? 'rgba(234,179,8,0.06)' : 'rgba(34,197,94,0.06)',
                border: `1px solid ${isExpired ? 'rgba(232,57,42,0.2)' : isExpiring ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.2)'}`,
            }}>
                <Clock className="w-5 h-5 flex-shrink-0" style={{ color: isExpired ? '#E8392A' : isExpiring ? '#CA8A04' : '#16A34A' }} />
                <span className="text-sm font-semibold" style={{ color: isExpired ? '#E8392A' : isExpiring ? '#CA8A04' : '#16A34A' }}>{daysLabel}</span>
            </div>

            {/* Lease details card */}
            <div className="rounded-2xl p-5 space-y-0" style={{ background: 'white', border: '1px solid #E9EBF0' }}>
                <p className="text-sm font-bold mb-3" style={{ color: '#111' }}>Lease Details</p>
                <InfoRow label="Property" value={prop?.name ?? '—'} />
                {prop?.address && <InfoRow label="Address" value={prop.address} />}
                <InfoRow label="Monthly Rent" value={`$${Number(lease.rent_amount).toLocaleString()}`} />
                <InfoRow label="Start Date" value={new Date(lease.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} />
                <InfoRow label="End Date" value={new Date(lease.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} highlight={isExpiring} />
                <div className="py-3">
                    <span className="text-sm" style={{ color: '#6B7280' }}>Status</span>
                    <span className="ml-auto float-right text-xs font-semibold px-2.5 py-1 rounded-full" style={{
                        background: isExpired ? 'rgba(232,57,42,0.1)' : 'rgba(34,197,94,0.1)',
                        color: isExpired ? '#E8392A' : '#16A34A'
                    }}>
                        {isExpired ? 'Expired' : 'Active'}
                    </span>
                </div>
            </div>

            {/* Document download */}
            {lease.document_url && (
                <div className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: 'white', border: '1px solid #E9EBF0' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,57,42,0.08)' }}>
                            <FileText className="w-5 h-5" style={{ color: '#E8392A' }} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: '#111' }}>Lease Document</p>
                            <p className="text-xs" style={{ color: '#9CA3AF' }}>PDF · Tap to download</p>
                        </div>
                    </div>
                    <button
                        onClick={downloadDoc}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                        style={{ background: '#E8392A' }}
                    >
                        <Download className="w-4 h-4" />
                        {downloading ? 'Loading…' : 'Download'}
                    </button>
                </div>
            )}
        </div>
    )
}
