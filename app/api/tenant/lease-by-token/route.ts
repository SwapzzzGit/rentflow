import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const token = req.nextUrl.searchParams.get('token')
        if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

        const { data: lease, error } = await supabase
            .from('leases')
            .select(`
        id, status, start_date, end_date, rent_amount, document_url,
        landlord_signature, landlord_signed_at,
        property:properties(name, address),
        tenant:tenants(full_name)
      `)
            .eq('signing_token', token)
            .single()

        if (error || !lease) {
            return NextResponse.json({ error: 'Invalid or expired signing link' }, { status: 404 })
        }

        return NextResponse.json(lease)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
