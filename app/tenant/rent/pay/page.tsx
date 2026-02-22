'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { loadStripe } from '@stripe/stripe-js'
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js'
import { CheckCircle, AlertCircle, ArrowLeft, Building2, Calendar, DollarSign } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentRecord = {
    id: string
    amount: number
    late_fee_amount: number
    due_date: string
    status: string
    tenants: {
        full_name: string
        properties: { address: string } | null
    } | null
}

// ─── Stripe checkout form ─────────────────────────────────────────────────────
function CheckoutForm({
    payment,
    onSuccess,
}: {
    payment: PaymentRecord
    onSuccess: () => void
}) {
    const stripe = useStripe()
    const elements = useElements()
    const [paying, setPaying] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!stripe || !elements) return

        setPaying(true)
        setErrorMsg(null)

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${appUrl}/tenant/rent/pay/success?id=${payment.id}`,
            },
            redirect: 'if_required',
        })

        if (error) {
            setErrorMsg(error.message ?? 'Payment failed. Please try again.')
            setPaying(false)
        } else {
            // Payment succeeded without redirect
            onSuccess()
        }
    }

    const total = Number(payment.amount) + Number(payment.late_fee_amount || 0)
    const hasLateFee = Number(payment.late_fee_amount) > 0

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Payment summary */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: '#F9FAFB', border: '1px solid #E9EBF0' }}>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Rent amount</span>
                    <span className="font-semibold text-gray-900">${Number(payment.amount).toLocaleString()}</span>
                </div>
                {hasLateFee && (
                    <div className="flex justify-between items-center text-sm">
                        <span style={{ color: '#E8392A' }}>Late fee</span>
                        <span className="font-semibold" style={{ color: '#E8392A' }}>+${Number(payment.late_fee_amount).toLocaleString()}</span>
                    </div>
                )}
                <div className="pt-2 flex justify-between items-center" style={{ borderTop: '1px solid #E9EBF0' }}>
                    <span className="text-sm font-bold text-gray-900">Total due</span>
                    <span className="text-xl font-bold" style={{ color: '#E8392A' }}>${total.toLocaleString()}</span>
                </div>
            </div>

            {/* Stripe Elements */}
            <div className="rounded-2xl p-5" style={{ border: '1px solid #E9EBF0', background: '#fff' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: '#9CA3AF' }}>Payment Details</p>
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        defaultValues: { billingDetails: { name: payment.tenants?.full_name } },
                    }}
                />
            </div>

            {errorMsg && (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(232,57,42,0.08)', border: '1px solid rgba(232,57,42,0.2)' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#E8392A' }} />
                    <p className="text-sm" style={{ color: '#E8392A' }}>{errorMsg}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || paying}
                className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: '#E8392A' }}
            >
                {paying ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing...
                    </span>
                ) : (
                    `Pay $${total.toLocaleString()} Now`
                )}
            </button>

            <p className="text-center text-xs" style={{ color: '#9CA3AF' }}>
                🔒 Secured by Stripe · PCI DSS compliant
            </p>
        </form>
    )
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ payment }: { payment: PaymentRecord }) {
    const router = useRouter()
    const total = Number(payment.amount) + Number(payment.late_fee_amount || 0)

    return (
        <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center animate-bounce" style={{ background: 'rgba(22,163,74,0.1)' }}>
                    <CheckCircle className="w-10 h-10" style={{ color: '#16A34A' }} />
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                <p className="text-gray-500 text-sm">Your payment of <strong>${total.toLocaleString()}</strong> has been received.</p>
            </div>
            <div className="rounded-2xl p-5 text-left space-y-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount paid</span>
                    <span className="font-bold" style={{ color: '#16A34A' }}>${total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Month</span>
                    <span className="font-semibold text-gray-900">
                        {new Date(payment.due_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Property</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[180px] truncate">
                        {payment.tenants?.properties?.address || '—'}
                    </span>
                </div>
            </div>
            <button
                onClick={() => router.push('/tenant/rent')}
                className="w-full py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: '#E8392A' }}
            >
                Back to Rent History
            </button>
        </div>
    )
}

// ─── Inner page (uses useSearchParams) ────────────────────────────────────────
function PayPageInner() {
    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()
    const rentPaymentId = searchParams.get('id')

    const [payment, setPayment] = useState<PaymentRecord | null>(null)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        async function init() {
            if (!rentPaymentId) { setError('No payment ID provided'); setLoading(false); return }

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/tenant/login'); return }

            // Fetch the payment record
            const { data, error: payErr } = await supabase
                .from('rent_payments')
                .select(`
                    id, amount, late_fee_amount, due_date, status,
                    tenants (
                        full_name,
                        properties (address)
                    )
                `)
                .eq('id', rentPaymentId)
                .single()

            if (payErr || !data) { setError('Payment record not found'); setLoading(false); return }
            if (data.status === 'paid') { setError('This payment has already been completed.'); setLoading(false); return }

            setPayment(data as unknown as PaymentRecord)

            // Create payment intent
            const res = await fetch('/api/stripe/payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rentPaymentId }),
            })
            const json = await res.json()
            if (!res.ok || !json.clientSecret) {
                setError(json.error || 'Failed to initialize payment')
                setLoading(false)
                return
            }

            setClientSecret(json.clientSecret)
            setLoading(false)
        }
        init()
    }, [rentPaymentId, supabase, router])

    if (loading) return (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: '#F3F4F6' }} />
            ))}
        </div>
    )

    if (error) return (
        <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#E8392A' }} />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Payment Error</h2>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button onClick={() => router.push('/tenant/rent')} className="px-6 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#E8392A' }}>
                Back to Rent
            </button>
        </div>
    )

    if (!payment) return null

    const property = Array.isArray(payment.tenants?.properties)
        ? payment.tenants.properties[0]
        : payment.tenants?.properties

    const stripeAppearance = {
        theme: 'stripe' as const,
        variables: {
            colorPrimary: '#E8392A',
            borderRadius: '10px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
    }

    return (
        <div className="space-y-6">
            {/* Back button */}
            <button
                onClick={() => router.push('/tenant/rent')}
                className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-70"
                style={{ color: '#6B7280' }}
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Rent
            </button>

            <div>
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-bricolage, serif)' }}>
                    {success ? 'Payment Complete' : 'Pay Rent Online'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    {new Date(payment.due_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* Property info */}
            {!success && (
                <div className="flex flex-wrap gap-4">
                    {[
                        { icon: Building2, label: property?.address || '—' },
                        { icon: Calendar, label: new Date(payment.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                        { icon: DollarSign, label: `$${(Number(payment.amount) + Number(payment.late_fee_amount || 0)).toLocaleString()} due` },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-2 text-sm" style={{ color: '#374151' }}>
                            <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#E8392A' }} />
                            <span className="truncate">{label}</span>
                        </div>
                    ))}
                </div>
            )}

            {success ? (
                <SuccessScreen payment={payment} />
            ) : clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
                    <CheckoutForm payment={payment} onSuccess={() => setSuccess(true)} />
                </Elements>
            ) : null}
        </div>
    )
}

// ─── Main export wrapped in Suspense for useSearchParams ──────────────────────
export default function TenantPayPage() {
    return (
        <Suspense fallback={
            <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: '#F3F4F6' }} />)}
            </div>
        }>
            <PayPageInner />
        </Suspense>
    )
}
