import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendRentDueReminder } from '@/lib/email/resend'

// Called daily at 9am UTC via Vercel Cron
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const supabase = await createClient()

        // Find payments due in 3 days that are still unpaid
        const threeDaysFromNow = new Date()
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
        const targetDate = threeDaysFromNow.toISOString().split('T')[0]

        const { data: payments, error } = await supabase
            .from('rent_payments')
            .select(`
                id, amount, due_date,
                tenants (
                    id, full_name, email,
                    properties (address)
                )
            `)
            .eq('status', 'unpaid')
            .eq('due_date', targetDate)

        if (error) {
            console.error('Rent reminder query error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        let sent = 0
        const errors: string[] = []

        for (const payment of (payments || [])) {
            const tenant = payment.tenants as any
            if (!tenant?.email) continue

            const property = Array.isArray(tenant.properties) ? tenant.properties[0] : tenant.properties
            if (!property) continue

            try {
                await sendRentDueReminder({
                    tenantEmail: tenant.email,
                    tenantName: tenant.full_name,
                    propertyAddress: property.address,
                    amount: payment.amount,
                    dueDate: payment.due_date,
                    rentPaymentId: payment.id,
                })
                sent++
            } catch (emailErr) {
                console.error(`Failed to send reminder for payment ${payment.id}:`, emailErr)
                errors.push(payment.id)
            }
        }

        return NextResponse.json({
            message: 'Rent reminders processed',
            sent,
            errors,
            timestamp: new Date().toISOString(),
        })
    } catch (err) {
        console.error('Rent reminder cron error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    return POST(req)
}
