'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantData } from '@/hooks/useTenantData'
import { SkeletonCard } from '@/components/tenant/SkeletonCard'
import { NoTenantFound } from '@/components/tenant/NoTenantFound'
import {
    FileText,
    Download,
    ShieldCheck,
    Calendar,
    MapPin,
    User,
    DollarSign
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

export default function TenantLeasePage() {
    const { tenant, loading: tenantLoading, error: tenantError } = useTenantData()
    const supabase = createClient()

    const [lease, setLease] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!tenant) return

        async function fetchLease() {
            try {
                const { data, error } = await supabase
                    .from('leases')
                    .select('*')
                    .eq('tenant_id', tenant.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                setLease(data || null)
            } catch (err) {
                console.error('Error fetching lease:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchLease()
    }, [tenant, supabase])

    if (tenantLoading) {
        return (
            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="h-8 w-48 bg-gray-100 animate-pulse rounded mb-10" />
                <div className="space-y-6">
                    <div className="h-64 bg-gray-100 animate-pulse rounded-2xl" />
                    <div className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
                </div>
            </div>
        )
    }

    if (!tenant || tenantError) {
        return <NoTenantFound />
    }

    const daysElapsed = lease ? differenceInDays(new Date(), new Date(lease.start_date)) : 0
    const totalDays = lease ? differenceInDays(new Date(lease.end_date), new Date(lease.start_date)) : 1
    const daysUntilEnd = lease ? differenceInDays(new Date(lease.end_date), new Date()) : 0

    const consumptionPercentage = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)))
    const leaseColor = daysUntilEnd < 30 ? 'text-red-600' : daysUntilEnd < 60 ? 'text-yellow-600' : 'text-green-600'

    return (
        <div className="max-w-3xl mx-auto px-6 py-8">
            <h1 className="text-2xl font-bold text-[#0A0A0A] mb-10" style={{ fontFamily: 'var(--font-serif)' }}>My Lease</h1>

            {lease ? (
                <>
                    {/* Lease Details Card */}
                    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8 mb-6">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-red-50 text-[#E8392A] rounded-xl flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[#0A0A0A]" style={{ fontFamily: 'var(--font-serif)' }}>Lease Agreement</h2>
                                <p className="text-xs text-[#888888]">Active Subscription</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            {[
                                { label: 'Property', value: tenant.properties?.name, icon: MapPin },
                                { label: 'Address', value: tenant.properties?.address, icon: MapPin },
                                { label: 'Tenant', value: tenant.full_name, icon: User },
                                { label: 'Lease Start', value: format(new Date(lease.start_date), 'MMMM d, yyyy'), icon: Calendar },
                                { label: 'Lease End', value: format(new Date(lease.end_date), 'MMMM d, yyyy'), icon: Calendar },
                                { label: 'Monthly Rent', value: `$${(lease.rent_amount || tenant.rent_amount)?.toLocaleString()}`, icon: DollarSign },
                            ].map((item, i) => (
                                <div key={item.label} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <item.icon className="w-4 h-4 text-gray-300" />
                                        <span className="text-sm text-gray-500">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-[#0A0A0A]">{item.value}</span>
                                </div>
                            ))}

                            <div className="flex justify-between items-center py-4 border-0">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-4 h-4 text-gray-300" />
                                    <span className="text-sm text-gray-500">Status</span>
                                </div>
                                <span className="bg-green-50 text-green-700 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider">ACTIVE</span>
                            </div>
                        </div>
                    </div>

                    {/* Days Remaining Card */}
                    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8 mb-6 text-center">
                        <h3 className={`text-6xl font-black ${leaseColor}`} style={{ fontFamily: 'var(--font-serif)' }}>
                            {daysUntilEnd}
                        </h3>
                        <p className="text-sm text-gray-400 mt-2 font-medium tracking-tight">days remaining on your lease</p>

                        <div className="mt-8 space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span>Lease Usage</span>
                                <span>{consumptionPercentage}%</span>
                            </div>
                            <div className="bg-gray-50 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-[#E8392A] h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${consumptionPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Document Card */}
                    {lease.document_url && (
                        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-50 text-[#E8392A] rounded-xl flex items-center justify-center">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0A0A0A]">Lease Agreement</h4>
                                    <p className="text-xs text-gray-400">PDF Document · Signed Copy</p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.open(lease.document_url, '_blank')}
                                className="w-full md:w-auto flex items-center justify-center gap-2 border border-[#E8392A] text-[#E8392A] rounded-full px-8 py-3 text-sm font-semibold hover:bg-red-50 transition-all"
                            >
                                <Download className="w-4 h-4" /> View Document
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-16 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                    <h2 className="text-lg font-bold text-[#0A0A0A] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>No lease on file</h2>
                    <p className="text-sm text-[#888888] mb-8 max-w-xs mx-auto">
                        Your landlord hasn't uploaded a digital lease agreement yet. Please contact them directly for details.
                    </p>
                </div>
            )}
        </div>
    )
}
