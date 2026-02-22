import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

        // Save landlord signature, move to pending_tenant
        const { error: updateErr } = await supabase
            .from('leases')
            .update({
                landlord_signature: signature,
                landlord_signed_at: new Date().toISOString(),
                status: 'pending_tenant',
            })
            .eq('id', leaseId)

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
