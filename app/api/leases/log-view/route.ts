import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClientInfo } from '@/lib/get-client-info'
import { logLeaseEvent } from '@/lib/audit'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { token } = await req.json()

        if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

        // Find lease by signing token
        const { data: lease, error: leaseErr } = await supabase
            .from('leases')
            .select(`
                id,
                tenant:tenants(full_name, email)
            `)
            .eq('signing_token', token)
            .single()

        if (leaseErr || !lease) {
            // Do not expose invalid token errors — just return success silently
            return NextResponse.json({ success: true })
        }

        const { ipAddress, userAgent } = getClientInfo(req)
        const tenant = (lease as any).tenant

        // Log TENANT_VIEWED event — proves tenant had access to the document
        await logLeaseEvent({
            leaseId: lease.id,
            event: 'TENANT_VIEWED',
            actorName: tenant?.full_name || 'Tenant',
            actorEmail: tenant?.email || '',
            ipAddress,
            userAgent,
        })

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('log-view error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
