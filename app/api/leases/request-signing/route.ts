import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendLeaseSigningRequest } from '@/lib/email/resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rentflow-virid.vercel.app'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { leaseId } = await req.json()
        if (!leaseId) return NextResponse.json({ error: 'leaseId required' }, { status: 400 })

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

        // Update lease
        const { error: updateErr } = await supabase
            .from('leases')
            .update({
                status: 'pending_landlord',
                signing_token: signingToken,
                signing_requested_at: new Date().toISOString(),
            })
            .eq('id', leaseId)

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

        // Get tenant details
        const { data: tenant } = await supabase
            .from('tenants')
            .select('full_name, email')
            .eq('id', (lease as any).tenant_id)
            .single()

        if (tenant?.email) {
            const { data: landlordProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single()

            const property = (lease as any).property
            const signingUrl = `${APP_URL}/tenant/lease/sign?token=${signingToken}`

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

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
