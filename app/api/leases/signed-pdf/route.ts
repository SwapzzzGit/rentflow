import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const leaseId = req.nextUrl.searchParams.get('leaseId')
        if (!leaseId) return NextResponse.json({ error: 'leaseId required' }, { status: 400 })

        // Check if user is a landlord for this lease
        const { data: lease } = await supabase
            .from('leases')
            .select('id, signed_pdf_url, user_id, tenant_id, status')
            .eq('id', leaseId)
            .single()

        if (!lease) return NextResponse.json({ error: 'Lease not found' }, { status: 404 })

        // Verify access — landlord or tenant portal user
        let hasAccess = false
        if (lease.user_id === user.id) {
            hasAccess = true
        } else {
            // Check if tenant portal user
            const { data: tenant } = await supabase
                .from('tenants')
                .select('id')
                .eq('id', (lease as any).tenant_id)
                .eq('portal_user_id', user.id)
                .single()
            if (tenant) hasAccess = true
        }

        if (!hasAccess) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        if (!lease.signed_pdf_url) return NextResponse.json({ error: 'No signed PDF available' }, { status: 404 })

        // Generate signed URL valid for 1 hour
        const { data, error } = await supabase.storage
            .from('lease-documents')
            .createSignedUrl(lease.signed_pdf_url, 3600)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ url: data.signedUrl })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
