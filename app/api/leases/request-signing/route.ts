import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendLeaseSigningRequest } from '@/lib/email/resend'
import { getClientInfo } from '@/lib/get-client-info'
import { logLeaseEvent } from '@/lib/audit'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rentflow-virid.vercel.app'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { leaseId } = await req.json()
        if (!leaseId) return NextResponse.json({ error: 'leaseId required' }, { status: 400 })

        // Extract client IP and user agent
        const { ipAddress, userAgent } = getClientInfo(req)

        // Verify lease belongs to landlord
        const { data: lease, error: leaseErr } = await supabase
            .from('leases')
            .select('id, status, tenant_id, property:properties(name, address)')
            .eq('id', leaseId)
            .eq('user_id', user.id)
            .single()

        if (leaseErr || !lease) return NextResponse.json({ error: 'Lease not found' }, { status: 404 })

        // Generate signing token
        const signingToken = crypto.randomUUID()

        // Update lease — store landlord IP/UA + status
        const { error: updateErr } = await supabase
            .from('leases')
            .update({
                status: 'pending_landlord',
                signing_token: signingToken,
                signing_requested_at: new Date().toISOString(),
                landlord_ip: ipAddress,
                landlord_user_agent: userAgent,
            })
            .eq('id', leaseId)

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

        // Get tenant details
        const { data: tenant } = await supabase
            .from('tenants')
            .select('full_name, email')
            .eq('id', (lease as any).tenant_id)
            .single()

        // Get landlord profile
        const { data: landlordProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single()

        const landlordName = landlordProfile?.full_name || 'Your landlord'
        const landlordEmail = landlordProfile?.email || user.email || ''

        // Log SIGNING_REQUESTED audit event
        await logLeaseEvent({
            leaseId,
            event: 'SIGNING_REQUESTED',
            actorName: landlordName,
            actorEmail: landlordEmail,
            ipAddress,
            userAgent,
        })

        if (tenant?.email) {
            const property = (lease as any).property
            const signingUrl = `${APP_URL}/tenant/lease/sign?token=${signingToken}`

            await sendLeaseSigningRequest({
                tenantName: tenant.full_name,
                tenantEmail: tenant.email,
                landlordName,
                propertyName: property?.name || 'your property',
                leaseStartDate: '',
                leaseEndDate: '',
                monthlyRent: 0,
                signingUrl,
            })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
