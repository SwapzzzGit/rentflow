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

        // 2. Fetch tenant, property, and landlord profile
        console.log(`[invite] Step 1: Fetching data for tenant ${tenantId}`)
        const [{ data: tenant, error: tenantErr }, { data: profile }] = await Promise.all([
            supabase
                .from('tenants')
                .select('id, email, full_name, user_id, portal_enabled, portal_user_id, property:properties(name)')
                .eq('id', tenantId)
                .eq('user_id', landlord.id)
                .single(),
            supabase
                .from('profiles')
                .select('full_name')
                .eq('id', landlord.id)
                .single()
        ])

        if (tenantErr || !tenant) {
            console.error('[invite] Tenant fetch error:', tenantErr)
            return NextResponse.json({ error: 'Tenant not found or not yours' }, { status: 404 })
        }
        if (!tenant.email) return NextResponse.json({ error: 'Tenant has no email address' }, { status: 400 })

        const admin = createAdminClient()
        const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/tenant/set-password`
        let inviteUrl = ''

        // 3. Generate Link (Bring Your Own Email approach)
        if (tenant.portal_user_id) {
            console.log(`[invite] Step 2 (Resend): Generating magic link for existing user ${tenant.email}`)
            const { data, error: linkErr } = await admin.auth.admin.generateLink({
                type: 'magiclink',
                email: tenant.email,
                options: { redirectTo }
            })
            if (linkErr) throw linkErr
            inviteUrl = data.properties.action_link
        } else {
            console.log(`[invite] Step 2 (New): Generating invite link for ${tenant.email}`)
            // generateLink with type 'invite' creates the user if doesn't exist
            const { data, error: linkErr } = await admin.auth.admin.generateLink({
                type: 'invite',
                email: tenant.email,
                options: { redirectTo, data: { role: 'tenant', tenant_id: tenantId } }
            })

            if (linkErr) {
                // If user already exists but isn't linked, find them
                if (linkErr.message.includes('already been registered')) {
                    const { data: users } = await admin.auth.admin.listUsers()
                    const existing = users?.users.find(u => u.email === tenant.email)
                    if (existing) {
                        console.log('[invite] User exists, generating magiclink')
                        const { data: magicData, error: magicErr } = await admin.auth.admin.generateLink({
                            type: 'magiclink',
                            email: tenant.email,
                            options: { redirectTo }
                        })
                        if (magicErr) throw magicErr
                        inviteUrl = magicData.properties.action_link
                        // Save the user ID if missing
                        if (!tenant.portal_user_id) {
                            await admin.from('tenants').update({ portal_user_id: existing.id }).eq('id', tenantId)
                        }
                    } else throw linkErr
                } else throw linkErr
            } else {
                inviteUrl = data.properties.action_link
                // Update portal_user_id for new user
                await admin.from('tenants').update({ portal_user_id: data.user.id }).eq('id', tenantId)
            }
        }

        // IMPORTANT: Log the URL to verify in Vercel it's the full action_link
        console.log('[invite] Final Invite URL being sent in email:', inviteUrl)

        // 4. Send Branded Email via Resend
        const { sendTenantPortalInvite } = await import('@/lib/email/resend')
        console.log(`[invite] Step 3: Sending Resend email to ${tenant.email}`)
        const resendResult = await sendTenantPortalInvite({
            tenantName: tenant.full_name,
            tenantEmail: tenant.email,
            landlordName: profile?.full_name || landlord.user_metadata?.full_name || 'Your Landlord',
            propertyName: (tenant.property as any)?.name || 'Property',
            inviteUrl: inviteUrl // This is the Supabase action_link
        })
        console.log('[invite] Resend result:', resendResult)

        // 5. Finalize tenant record
        await admin.from('tenants').update({
            portal_enabled: true,
            portal_invited_at: new Date().toISOString(),
        }).eq('id', tenantId)

        return NextResponse.json({
            success: true,
            message: `Invite sent to ${tenant.email} via Resend branded template.`
        })
    } catch (err: any) {
        console.error('[invite]', err)
        return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
    }
}
