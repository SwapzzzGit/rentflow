'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantData } from '@/hooks/useTenantData'
import { SkeletonCard } from '@/components/tenant/SkeletonCard'
import { NoTenantFound } from '@/components/tenant/NoTenantFound'
import {
    ChevronLeft,
    ChevronRight,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Calendar
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns'

export default function TenantRentPage() {
    const { tenant, loading: tenantLoading, error: tenantError } = useTenantData()
    const supabase = createClient()

    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())

    useEffect(() => {
        if (!tenant) return

        async function fetchPayments() {
            try {
                const { data, error } = await supabase
                    .from('rent_payments')
                    .select('*')
                    .eq('tenant_id', tenant.id)
                    .order('due_date', { ascending: false })

                setPayments(data || [])
            } catch (err) {
                console.error('Error fetching payments:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchPayments()
    }, [tenant, supabase])

    if (tenantLoading) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="h-8 w-48 bg-gray-100 animate-pulse rounded mb-8" />
                <SkeletonCard />
                <div className="mt-8 space-y-4">
                    <div className="h-64 bg-gray-100 animate-pulse rounded-2xl" />
                </div>
            </div>
        )
    }

    if (!tenant || tenantError) {
        return <NoTenantFound />
    }

    const currentMonthStart = startOfMonth(currentDate)
    const currentMonthEnd = endOfMonth(currentDate)

    const currentMonthPayment = payments.find(p => {
        const dueDate = new Date(p.due_date)
        return dueDate >= currentMonthStart && dueDate <= currentMonthEnd
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <span className="bg-green-50 text-green-700 rounded-full px-3 py-1 text-xs font-semibold">PAID</span>
            case 'overdue': return <span className="bg-red-50 text-red-600 rounded-full px-3 py-1 text-xs font-semibold">OVERDUE</span>
            default: return <span className="bg-yellow-50 text-yellow-700 rounded-full px-3 py-1 text-xs font-semibold uppercase">{status}</span>
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: 'var(--font-serif)' }}>Rent Payments</h1>

                <div className="flex items-center gap-4 bg-white border border-black/5 rounded-full px-4 py-2 shadow-sm">
                    <button
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                        className="p-1 hover:bg-gray-50 rounded-full transition"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <span className="text-sm font-bold min-w-[120px] text-center">{format(currentDate, 'MMMM yyyy')}</span>
                    <button
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                        className="p-1 hover:bg-gray-50 rounded-full transition"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Current Month Hero Card */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8392A]/[0.02] rounded-full -translate-y-1/2 translate-x-1/2" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <p className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Amount due this month</p>
                        <h2 className="text-5xl font-bold text-[#0A0A0A] mt-2">${tenant.rent_amount?.toLocaleString()}</h2>
                        <div className="flex items-center gap-2 mt-3 text-gray-500 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>Due {format(currentMonthStart, 'MMM 1, yyyy')}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        {currentMonthPayment ? (
                            <>
                                <div className={`px-4 py-2 rounded-full text-sm font-bold ${currentMonthPayment.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                                    }`}>
                                    {currentMonthPayment.status.toUpperCase()}
                                </div>
                            </>
                        ) : (
                            <div className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full text-sm font-bold">
                                PENDING
                            </div>
                        )}

                        <Link
                            href="/tenant/rent/pay"
                            className="bg-[#E8392A] text-white px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-red-500/20"
                        >
                            Pay Now
                        </Link>
                    </div>
                </div>

                {currentMonthPayment?.status === 'overdue' && (
                    <div className="mt-8 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <p className="text-red-600 text-sm">
                            ⚠️ This payment is overdue. Please contact your landlord as soon as possible to avoid late fees.
                        </p>
                    </div>
                )}

                {currentMonthPayment?.status === 'paid' && (
                    <div className="mt-8 bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-700 mt-0.5" />
                        <p className="text-green-700 text-sm">
                            ✅ Payment received on {format(new Date(currentMonthPayment.paid_date), 'MMMM d, yyyy')}. Thank you!
                        </p>
                    </div>
                )}
            </div>

            {/* Payment History Table */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8">
                <h3 className="text-lg font-bold text-[#0A0A0A] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>Payment History</h3>

                {payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 pb-4">
                                    <th className="text-[10px] font-bold text-[#888888] uppercase tracking-wider pb-4">Month</th>
                                    <th className="text-[10px] font-bold text-[#888888] uppercase tracking-wider pb-4">Amount Due</th>
                                    <th className="text-[10px] font-bold text-[#888888] uppercase tracking-wider pb-4">Due Date</th>
                                    <th className="text-[10px] font-bold text-[#888888] uppercase tracking-wider pb-4">Paid Date</th>
                                    <th className="text-[10px] font-bold text-[#888888] uppercase tracking-wider pb-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                                        <td className="py-5 text-sm font-semibold text-[#0A0A0A]">
                                            {format(new Date(payment.due_date), 'MMMM yyyy')}
                                        </td>
                                        <td className="py-5 text-sm font-bold text-[#0A0A0A]">
                                            ${payment.amount?.toLocaleString()}
                                        </td>
                                        <td className="py-5 text-sm text-[#888888]">
                                            {format(new Date(payment.due_date), 'MMM d, yyyy')}
                                        </td>
                                        <td className="py-5 text-sm text-[#888888]">
                                            {payment.paid_date ? format(new Date(payment.paid_date), 'MMM d, yyyy') : '—'}
                                        </td>
                                        <td className="py-5">
                                            {getStatusBadge(payment.status)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-12 text-center text-gray-400">
                        <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="text-sm font-medium text-[#0A0A0A]">No payment history yet</p>
                        <p className="text-xs">Records will appear here as they are generated by your landlord.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
