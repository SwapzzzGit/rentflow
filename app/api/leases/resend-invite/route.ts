import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendLeaseSigningRequest } from '@/lib/email/resend'
import { logLeaseEvent } from '@/lib/audit'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rentflow-virid.vercel.app'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { leaseId } = await req.json()
        if (!leaseId) return NextResponse.json({ error: 'leaseId required' }, { status: 400 })

        // Verify lease belongs to landlord and is awaiting tenant signature
        const { data: lease, error: leaseErr } = await supabase
            .from('leases')
            .select(`
                id, status, signing_token, tenant_id,
                property:properties(name, address),
                tenant:tenants(full_name, email)
            `)
            .eq('id', leaseId)
            .eq('user_id', user.id)
            .single()

        if (leaseErr || !lease) return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
        if (lease.status !== 'pending_tenant') {
            return NextResponse.json({ error: 'Lease is not awaiting tenant signature' }, { status: 400 })
        }
        if (!lease.signing_token) {
            return NextResponse.json({ error: 'No signing token found for this lease' }, { status: 400 })
        }

        const tenant = (lease as any).tenant
        const property = (lease as any).property

        // Get landlord profile
        const { data: landlordProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

        const signingUrl = `${APP_URL}/tenant/lease/sign?token=${lease.signing_token}`

        if (tenant?.email) {
            await sendLeaseSigningRequest({
                tenantName: tenant.full_name,
                tenantEmail: tenant.email,
                landlordName: landlordProfile?.full_name || 'Your landlord',
                propertyName: property?.name || 'your property',
                leaseStartDate: '',
                leaseEndDate: '',
                monthlyRent: 0,
                signingUrl,
            })
        }

        // Log REMINDER_SENT to audit
        await logLeaseEvent({
            leaseId,
            event: 'SIGNING_REQUESTED',
            actorName: landlordProfile?.full_name || 'Landlord',
            actorEmail: user.email || '',
            ipAddress: 'Dashboard',
            userAgent: 'RentFlow/Reminder',
            metadata: { type: 'REMINDER_SENT', sentTo: tenant?.email },
        })

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
