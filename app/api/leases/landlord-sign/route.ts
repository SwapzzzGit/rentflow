import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClientInfo } from '@/lib/get-client-info'
import { logLeaseEvent } from '@/lib/audit'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { leaseId, signature } = await req.json()
        if (!leaseId || !signature) {
            return NextResponse.json({ error: 'leaseId and signature required' }, { status: 400 })
        }

        // Validate base64 PNG
        if (!signature.startsWith('data:image/png;base64,')) {
            return NextResponse.json({ error: 'Invalid signature format' }, { status: 400 })
        }

        // Extract client IP and user agent
        const { ipAddress, userAgent } = getClientInfo(req)

        // Verify lease belongs to landlord and is in correct status
        const { data: lease, error: leaseErr } = await supabase
            .from('leases')
            .select('id, status, tenant_id, property:properties(name, address)')
            .eq('id', leaseId)
            .eq('user_id', user.id)
            .single()

        if (leaseErr || !lease) return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
        if ((lease as any).status !== 'pending_landlord') {
            return NextResponse.json({ error: 'Lease is not awaiting landlord signature' }, { status: 400 })
        }

        const signedAt = new Date().toISOString()

        // Save landlord signature, move to pending_tenant, store IP
        const { error: updateErr } = await supabase
            .from('leases')
            .update({
                landlord_signature: signature,
                landlord_signed_at: signedAt,
                status: 'pending_tenant',
                landlord_ip: ipAddress,
                landlord_user_agent: userAgent,
            })
            .eq('id', leaseId)

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

        // Get landlord profile for audit log
        const { data: landlordProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single()

        const landlordName = landlordProfile?.full_name || 'Landlord'
        const landlordEmail = landlordProfile?.email || user.email || ''

        // Log LANDLORD_SIGNED audit event
        await logLeaseEvent({
            leaseId,
            event: 'LANDLORD_SIGNED',
            actorName: landlordName,
            actorEmail: landlordEmail,
            ipAddress,
            userAgent,
            metadata: { signedAt },
        })

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
