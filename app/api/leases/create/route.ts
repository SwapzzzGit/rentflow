import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { property_id, tenant_id, start_date, end_date, rent_amount, notes, document_url, confirmReplace } = body

        if (!property_id || !tenant_id || !start_date || !end_date) {
            return NextResponse.json({ error: 'Property, tenant, and lease dates are required' }, { status: 400 })
        }

        // Check if tenant already has an active/signed lease
        const { data: existingLeases } = await supabase
            .from('leases')
            .select('id, status')
            .eq('tenant_id', tenant_id)
            .eq('user_id', user.id)
            .in('status', ['signed', 'active', 'pending_landlord', 'pending_tenant', 'draft'])

        const activeLeases = (existingLeases || []).filter(l =>
            ['signed', 'active'].includes(l.status)
        )
        const draftLeases = (existingLeases || []).filter(l =>
            ['pending_landlord', 'pending_tenant', 'draft'].includes(l.status)
        )

        // Block if active/signed lease exists
        if (activeLeases.length > 0) {
            return NextResponse.json({
                error: 'This tenant already has an active lease. Please terminate the existing lease before creating a new one.',
                code: 'ACTIVE_LEASE_EXISTS',
            }, { status: 409 })
        }

        // If draft/unsigned leases exist, require confirmation to delete them
        if (draftLeases.length > 0 && !confirmReplace) {
            return NextResponse.json({
                error: 'This tenant has an unsigned lease. Delete it and create a new one?',
                code: 'DRAFT_LEASE_EXISTS',
                draftIds: draftLeases.map(l => l.id),
            }, { status: 409 })
        }

        // Delete draft leases if confirmed
        if (draftLeases.length > 0 && confirmReplace) {
            await supabase
                .from('leases')
                .delete()
                .in('id', draftLeases.map(l => l.id))
        }

        // Create the new lease
        const { data: lease, error } = await supabase
            .from('leases')
            .insert([{
                user_id: user.id,
                property_id,
                tenant_id,
                start_date,
                end_date,
                rent_amount: rent_amount ? parseFloat(rent_amount) : null,
                status: 'draft',
                document_url: document_url || null,
                notes: notes || null,
            }])
            .select('id')
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ success: true, leaseId: lease.id })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
