import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendLeaseExpiryAlert } from '@/lib/email/resend'

// Called daily at 9am UTC via Vercel Cron
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const supabase = await createClient()

        const now = new Date()
        const in60Days = new Date(now)
        in60Days.setDate(in60Days.getDate() + 60)

        const { data: leases, error } = await supabase
            .from('leases')
            .select(`
                id, end_date,
                tenants (
                    id, full_name, email,
                    properties (
                        address, user_id,
                        profiles!properties_user_id_fkey (
                            full_name, email
                        )
                    )
                )
            `)
            .gte('end_date', now.toISOString().split('T')[0])
            .lte('end_date', in60Days.toISOString().split('T')[0])

        if (error) {
            console.error('Lease expiry query error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        let sent = 0

        for (const lease of (leases || [])) {
            const tenant = lease.tenants as any
            const property = Array.isArray(tenant?.properties) ? tenant.properties[0] : tenant?.properties
            const landlordProfile = Array.isArray(property?.profiles) ? property.profiles[0] : property?.profiles

            const expiry = new Date(lease.end_date)
            const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

            // Email landlord at 60 days
            if (landlordProfile?.email) {
                await sendLeaseExpiryAlert({
                    recipientEmail: landlordProfile.email,
                    recipientName: landlordProfile.full_name || 'Landlord',
                    tenantName: tenant?.full_name || 'Tenant',
                    propertyAddress: property?.address || 'Property',
                    daysLeft,
                    expiryDate: lease.end_date,
                    isLandlord: true,
                }).catch(e => console.error('Landlord lease email error:', e))
                sent++
            }

            // Also email tenant if < 30 days
            if (daysLeft <= 30 && tenant?.email) {
                await sendLeaseExpiryAlert({
                    recipientEmail: tenant.email,
                    recipientName: tenant.full_name || 'Tenant',
                    tenantName: tenant.full_name || 'Tenant',
                    propertyAddress: property?.address || 'Property',
                    daysLeft,
                    expiryDate: lease.end_date,
                    isLandlord: false,
                }).catch(e => console.error('Tenant lease email error:', e))
                sent++
            }
        }

        return NextResponse.json({
            message: 'Lease expiry alerts processed',
            sent,
            leases_checked: leases?.length ?? 0,
            timestamp: new Date().toISOString(),
        })
    } catch (err) {
        console.error('Lease expiry cron error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    return POST(req)
}
