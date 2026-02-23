import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

// Admin client uses service role key — server only, never shipped to browser
function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(req: NextRequest) {
    try {
        const { tenantId } = await req.json()
        if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 })

        // 1. Get the requesting landlord session from cookie
        const { createServerClient } = await import('@supabase/ssr')
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll() { /* read-only in Route Handler */ },
                },
            }
        )

        const { data: { user: landlord } } = await supabase.auth.getUser()
        if (!landlord) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 2. Verify this tenant belongs to this landlord
        const { data: tenant, error: tenantErr } = await supabase
            .from('tenants')
            .select('id, email, full_name, user_id, portal_enabled')
            .eq('id', tenantId)
            .eq('user_id', landlord.id)
            .single()

        if (tenantErr || !tenant) return NextResponse.json({ error: 'Tenant not found or not yours' }, { status: 404 })
        if (!tenant.email) return NextResponse.json({ error: 'Tenant has no email address' }, { status: 400 })

        // 3. Invite via admin API (sends magic link email)
        const admin = createAdminClient()
        const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(tenant.email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/tenant/set-password`,
            data: { role: 'tenant', tenant_id: tenantId },
        })

        if (inviteErr) {
            // If user already exists, look them up
            if (!inviteErr.message.includes('already been registered')) {
                return NextResponse.json({ error: inviteErr.message }, { status: 500 })
            }
            // User already exists — find their ID
            const { data: existingUsers } = await admin.auth.admin.listUsers()
            const existing = existingUsers?.users.find(u => u.email === tenant.email)
            if (!existing) return NextResponse.json({ error: 'Could not find existing user' }, { status: 500 })

            await admin.from('tenants').update({
                portal_user_id: existing.id,
                portal_enabled: true,
                portal_invited_at: new Date().toISOString(),
            }).eq('id', tenantId)

            return NextResponse.json({ success: true, message: 'Portal access updated for existing user' })
        }

        // 4. Update the tenant record with the new auth user
        const { error: updateErr } = await admin.from('tenants').update({
            portal_user_id: invited.user.id,
            portal_enabled: true,
            portal_invited_at: new Date().toISOString(),
        }).eq('id', tenantId)

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

        return NextResponse.json({ success: true, message: `Invite sent to ${tenant.email}` })
    } catch (err: any) {
        console.error('[invite]', err)
        return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
    }
}
