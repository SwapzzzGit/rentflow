import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendLeaseTerminationToTenant, sendLeaseTerminationConfirmToLandlord } from '@/lib/email/resend'
import { logLeaseEvent } from '@/lib/audit'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { leaseId, reasonCategory, reasonDetail, noticePeriodDays, effectiveDate } = await req.json()

        if (!leaseId || !reasonCategory || !reasonDetail || !effectiveDate) {
            return NextResponse.json({ error: 'leaseId, reasonCategory, reasonDetail, and effectiveDate are required' }, { status: 400 })
        }

        // Validate effectiveDate is today or future
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const effective = new Date(effectiveDate)
        if (effective < today) {
            return NextResponse.json({ error: 'Effective date must be today or in the future' }, { status: 400 })
        }

        // Verify lease belongs to landlord and is signed
        const { data: lease, error: leaseErr } = await supabase
            .from('leases')
            .select(`
                id, status, tenant_id, user_id,
                property:properties(name, address),
                tenant:tenants(full_name, email)
            `)
            .eq('id', leaseId)
            .eq('user_id', user.id)
            .single()

        if (leaseErr || !lease) return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
        if (lease.status !== 'signed') {
            return NextResponse.json({ error: 'Only signed leases can be terminated' }, { status: 400 })
        }

        const tenant = (lease as any).tenant
        const property = (lease as any).property

        // Get landlord profile
        const { data: landlordProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single()

        const landlordName = landlordProfile?.full_name || 'Landlord'
        const landlordEmail = landlordProfile?.email || user.email || ''
        const now = new Date().toISOString()

        // INSERT into lease_terminations
        await supabase.from('lease_terminations').insert({
            lease_id: leaseId,
            initiated_by: user.id,
            reason_category: reasonCategory,
            reason_detail: reasonDetail,
            notice_period_days: noticePeriodDays || 30,
            effective_date: effectiveDate,
            tenant_notified: !!tenant?.email,
            landlord_notified: !!landlordEmail,
        })

        // UPDATE leases
        const { error: updateErr } = await supabase
            .from('leases')
            .update({
                status: 'terminated',
                terminated_at: now,
                termination_reason: reasonDetail,
                terminated_by: landlordName,
                termination_notice_days: noticePeriodDays || 30,
            })
            .eq('id', leaseId)

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

        // Log audit event
        await logLeaseEvent({
            leaseId,
            event: 'SIGNING_REQUESTED', // reuse existing event type as LEASE_TERMINATED
            actorName: landlordName,
            actorEmail: landlordEmail,
            ipAddress: 'Dashboard',
            userAgent: 'RentFlow/Termination',
            metadata: {
                type: 'LEASE_TERMINATED',
                reasonCategory,
                reasonDetail,
                noticePeriodDays,
                effectiveDate,
            },
        })

        const effectiveDateFormatted = new Date(effectiveDate).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric',
        })

        // Send emails
        if (tenant?.email) {
            await sendLeaseTerminationToTenant({
                tenantName: tenant.full_name,
                tenantEmail: tenant.email,
                propertyName: property?.name || 'your property',
                landlordName,
                reasonCategory,
                reasonDetail,
                noticePeriodDays: noticePeriodDays || 30,
                effectiveDate: effectiveDateFormatted,
            })
        }

        if (landlordEmail) {
            await sendLeaseTerminationConfirmToLandlord({
                landlordName,
                landlordEmail,
                tenantName: tenant?.full_name || 'Tenant',
                propertyName: property?.name || 'your property',
                reasonCategory,
                effectiveDate: effectiveDateFormatted,
            })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('terminate error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
