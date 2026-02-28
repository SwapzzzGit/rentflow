'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantData } from '@/hooks/useTenantData'
import { SkeletonCard } from '@/components/tenant/SkeletonCard'
import { NoTenantFound } from '@/components/tenant/NoTenantFound'
import { SlidePanel } from '@/components/ui/slide-panel'
import {
    Wrench,
    Plus,
    Clock,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function TenantMaintenancePage() {
    const { tenant, loading: tenantLoading, error: tenantError } = useTenantData()
    const supabase = createClient()

    const [tickets, setTickets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isPanelOpen, setIsPanelOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'General',
        priority: 'Low'
    })

    const fetchTickets = async () => {
        if (!tenant) return
        try {
            const { data, error } = await supabase
                .from('maintenance_tickets')
                .select('*')
                .eq('tenant_id', tenant.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setTickets(data || [])
        } catch (err) {
            console.error('Error fetching tickets:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTickets()
    }, [tenant, supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title) {
            toast.error('Please enter a title')
            return
        }

        setSubmitting(true)
        try {
            // LANDLORD ID is needed for the user_id field due to RLS
            const { data, error } = await supabase
                .from('maintenance_tickets')
                .insert({
                    user_id: tenant.properties.user_id, // Important: using landlord ID
                    property_id: tenant.property_id,
                    tenant_id: tenant.id,
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    priority: formData.priority,
                    status: 'open',
                    raised_by: 'tenant'
                })

            if (error) throw error

            toast.success('Request submitted. Your landlord has been notified.')
            setIsPanelOpen(false)
            setFormData({ title: '', description: '', category: 'General', priority: 'Low' })
            fetchTickets()
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit request')
        } finally {
            setSubmitting(false)
        }
    }

    if (tenantLoading) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-10">
                    <div className="h-8 w-48 bg-gray-100 animate-pulse rounded" />
                    <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-full" />
                </div>
                <div className="space-y-4">
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <span className="bg-red-50 text-red-600 rounded-full px-3 py-1 text-xs font-semibold">OPEN</span>
            case 'in_progress': return <span className="bg-yellow-50 text-yellow-700 rounded-full px-3 py-1 text-xs font-semibold">IN PROGRESS</span>
            case 'fixed': return <span className="bg-green-50 text-green-700 rounded-full px-3 py-1 text-xs font-semibold">FIXED</span>
            default: return <span className="bg-gray-50 text-gray-600 rounded-full px-3 py-1 text-xs font-semibold uppercase">{status}</span>
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return '#E8392A'
            case 'medium': return '#EAB308'
            default: return '#94A3B8'
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: 'var(--font-serif)' }}>Maintenance</h1>
                <button
                    onClick={() => setIsPanelOpen(true)}
                    className="bg-[#E8392A] text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition flex items-center gap-2 shadow-lg shadow-red-500/20"
                >
                    <Plus className="w-4 h-4" /> New Request
                </button>
            </div>

            {/* Ticket List */}
            {tickets.length > 0 ? (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 hover:shadow-md transition cursor-pointer group flex gap-5"
                            style={{ borderLeft: `4px solid ${getPriorityColor(ticket.priority)}` }}
                        >
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-[#0A0A0A] group-hover:text-[#E8392A] transition">{ticket.title}</h3>
                                    {getStatusBadge(ticket.status)}
                                </div>

                                <div className="flex items-center gap-4 mb-3">
                                    <span className="bg-gray-50 text-gray-500 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{ticket.category}</span>
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs text-[10px] font-medium uppercase tracking-wider">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                                    </div>
                                </div>

                                <p className="text-sm text-[#888888] line-clamp-2 leading-relaxed">
                                    {ticket.description || 'No description provided.'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-16 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Wrench className="w-8 h-8 text-gray-300" />
                    </div>
                    <h2 className="text-lg font-bold text-[#0A0A0A] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>No maintenance requests yet</h2>
                    <p className="text-sm text-[#888888] mb-8 max-w-sm mx-auto">
                        Submit a request if something needs fixing at your property. Your landlord will be notified immediately.
                    </p>
                    <button
                        onClick={() => setIsPanelOpen(true)}
                        className="text-[#E8392A] text-sm font-semibold flex items-center gap-2 mx-auto hover:opacity-80 transition"
                    >
                        <Plus className="w-4 h-4" /> Submit your first request
                    </button>
                </div>
            )}

            {/* New Request Slide Panel */}
            <SlidePanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                title="Submit Maintenance Request"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Issue Title</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Leaking tap in bathroom"
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E8392A]/10 transition-all text-sm"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                        <textarea
                            rows={4}
                            placeholder="Describe the issue in detail..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E8392A]/10 transition-all text-sm resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E8392A]/10 transition-all text-sm"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {['Plumbing', 'Electrical', 'Painting', 'Appliance', 'Structural', 'General', 'Other'].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E8392A]/10 transition-all text-sm"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            >
                                {['Low', 'Medium', 'High'].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-[#E8392A] text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                            </>
                        ) : (
                            'Submit Request'
                        )}
                    </button>
                </form>
            </SlidePanel>
        </div>
    )
}
