'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantData } from '@/hooks/useTenantData'
import { SkeletonCard } from '@/components/tenant/SkeletonCard'
import { NoTenantFound } from '@/components/tenant/NoTenantFound'
import {
    DollarSign,
    CheckCircle,
    AlertCircle,
    FileText,
    Wrench,
    ArrowRight,
    Clock
} from 'lucide-react'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'

export default function TenantDashboard() {
    const { tenant, loading: tenantLoading, error: tenantError } = useTenantData()
    const supabase = createClient()

    const [payments, setPayments] = useState<any[]>([])
    const [tickets, setTickets] = useState<any[]>([])
    const [lease, setLease] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!tenant) return

        async function fetchDashboardData() {
            try {
                const [paymentsRes, ticketsRes, leaseRes] = await Promise.all([
                    supabase
                        .from('rent_payments')
                        .select('*')
                        .eq('tenant_id', tenant.id)
                        .order('due_date', { ascending: false })
                        .limit(6),
                    supabase
                        .from('maintenance_tickets')
                        .select('*')
                        .eq('tenant_id', tenant.id)
                        .order('created_at', { ascending: false })
                        .limit(3),
                    supabase
                        .from('leases')
                        .select('*')
                        .eq('tenant_id', tenant.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single()
                ])

                setPayments(paymentsRes.data || [])
                setTickets(ticketsRes.data || [])
                setLease(leaseRes.data || null)
            } catch (err) {
                console.error('Error fetching dashboard data:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [tenant, supabase])

    if (tenantLoading) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="h-8 w-64 bg-gray-100 animate-pulse rounded mb-8" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        )
    }

    if (!tenant || tenantError) {
        return <NoTenantFound />
    }

    const hour = new Date().getHours()
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

    const currentMonthPayment = payments.find(p => {
        const dueDate = new Date(p.due_date)
        return dueDate.getMonth() === new Date().getMonth() && dueDate.getFullYear() === new Date().getFullYear()
    })

    const daysUntilLeaseEnd = lease ? differenceInDays(new Date(lease.end_date), new Date()) : 0
    const leaseColor = daysUntilLeaseEnd < 30 ? 'text-red-600' : daysUntilLeaseEnd < 60 ? 'text-yellow-600' : 'text-green-600'

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <span className="bg-green-50 text-green-700 rounded-full px-3 py-1 text-xs font-semibold">PAID</span>
            case 'overdue': return <span className="bg-red-50 text-red-600 rounded-full px-3 py-1 text-xs font-semibold">OVERDUE</span>
            case 'pending': return <span className="bg-yellow-50 text-yellow-700 rounded-full px-3 py-1 text-xs font-semibold">PENDING</span>
            case 'open': return <span className="bg-red-50 text-red-600 rounded-full px-3 py-1 text-xs font-semibold">OPEN</span>
            case 'in_progress': return <span className="bg-yellow-50 text-yellow-700 rounded-full px-3 py-1 text-xs font-semibold">IN PROGRESS</span>
            case 'fixed': return <span className="bg-green-50 text-green-700 rounded-full px-3 py-1 text-xs font-semibold">FIXED</span>
            default: return <span className="bg-gray-50 text-gray-600 rounded-full px-3 py-1 text-xs font-semibold uppercase">{status}</span>
        }
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-8">
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#0A0A0A] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                    Good {timeOfDay}, {tenant.full_name} 👋
                </h1>
                <p className="text-[#888888] text-sm">
                    {tenant.properties?.name} · {tenant.properties?.address}
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                {/* Monthly Rent */}
                <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-bold text-[#888888] uppercase tracking-wider mb-1">Monthly Rent</p>
                            <h3 className="text-2xl font-bold text-[#0A0A0A]">${tenant.rent_amount?.toLocaleString()}</h3>
                        </div>
                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs text-[#888888]">Due on the 1st of each month</p>
                </div>

                {/* This Month Status */}
                <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-bold text-[#888888] uppercase tracking-wider mb-1">This Month</p>
                            <h3 className="text-2xl font-bold text-[#0A0A0A]">{currentMonthPayment?.status?.toUpperCase() || 'NO RECORD'}</h3>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentMonthPayment?.status === 'paid' ? 'bg-green-50 text-green-600' :
                                currentMonthPayment?.status === 'overdue' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                            }`}>
                            {currentMonthPayment?.status === 'paid' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        </div>
                    </div>
                    <p className="text-xs text-[#888888]">
                        {currentMonthPayment?.status === 'paid' ? `Paid on ${format(new Date(currentMonthPayment.paid_date), 'MMM d')}` :
                            currentMonthPayment?.status === 'overdue' ? `${differenceInDays(new Date(), new Date(currentMonthPayment.due_date))} days overdue` :
                                'Payment due soon'}
                    </p>
                </div>

                {/* Lease Ends */}
                <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-bold text-[#888888] uppercase tracking-wider mb-1">Lease Ends</p>
                            <h3 className="text-2xl font-bold text-[#0A0A0A]">
                                {lease ? format(new Date(lease.end_date), 'MMM d, yyyy') : 'No Lease'}
                            </h3>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <p className={`text-xs font-medium ${leaseColor}`}>
                        {lease ? `${daysUntilLeaseEnd} days remaining` : 'Contact your landlord'}
                    </p>
                </div>
            </div>

            {/* Rent History Table */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-[#0A0A0A]" style={{ fontFamily: 'var(--font-serif)' }}>Rent Payment History</h2>
                    <Link href="/tenant/rent" className="text-xs font-semibold text-[#E8392A] hover:opacity-80 transition flex items-center gap-1">
                        View all <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                {payments.length > 0 ? (
                    <div className="space-y-1">
                        {payments.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#0A0A0A]">{format(new Date(payment.due_date), 'MMMM yyyy')}</p>
                                        <p className="text-[10px] text-[#888888]">Due: {format(new Date(payment.due_date), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <span className="text-sm font-bold text-[#0A0A0A]">${payment.amount?.toLocaleString()}</span>
                                    {getStatusBadge(payment.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <DollarSign className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-[#0A0A0A]">No payment records yet</p>
                        <p className="text-xs text-[#888888]">Your landlord will generate rent records each month</p>
                    </div>
                )}
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Maintenance */}
                <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-[#0A0A0A]" style={{ fontFamily: 'var(--font-serif)' }}>Recent Maintenance</h2>
                        <Link href="/tenant/maintenance" className="text-xs font-semibold text-[#E8392A] hover:opacity-80 transition flex items-center gap-1">
                            View all <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {tickets.length > 0 ? (
                        <div className="space-y-1">
                            {tickets.map((ticket) => (
                                <div key={ticket.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                                    <p className="text-sm font-medium text-[#0A0A0A]">{ticket.title}</p>
                                    {getStatusBadge(ticket.status)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-400">
                            <Wrench className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-xs">No maintenance requests yet</p>
                        </div>
                    )}
                </div>

                {/* My Lease */}
                <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-[#0A0A0A]" style={{ fontFamily: 'var(--font-serif)' }}>My Lease</h2>
                        <Link href="/tenant/lease" className="text-xs font-semibold text-[#E8392A] hover:opacity-80 transition flex items-center gap-1">
                            View details <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {lease ? (
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 text-sm border-b border-gray-50 last:border-0">
                                <span className="text-gray-500">Start Date</span>
                                <span className="font-medium text-[#0A0A0A]">{format(new Date(lease.start_date), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm border-b border-gray-50 last:border-0">
                                <span className="text-gray-500">End Date</span>
                                <span className="font-medium text-[#0A0A0A]">{format(new Date(lease.end_date), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm border-b border-gray-50 last:border-0">
                                <span className="text-gray-500">Monthly Rent</span>
                                <span className="font-medium text-[#0A0A0A]">${lease.rent_amount?.toLocaleString() || tenant.rent_amount?.toLocaleString()}</span>
                            </div>
                            <div className="mt-2 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-gray-50 ${leaseColor}`}>
                                    {daysUntilLeaseEnd} DAYS REMAINING
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-400">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-xs">No lease on file. Contact your landlord.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
