import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This endpoint is called by Vercel Cron daily at 10am
// It also checks a CRON_SECRET for security
export async function POST(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const supabase = await createClient()

        // Get all late fee rules
        const { data: rules } = await supabase
            .from('late_fee_rules')
            .select('user_id, property_id, fee_type, fee_amount, grace_period_days')

        if (!rules || rules.length === 0) {
            return NextResponse.json({ message: 'No late fee rules configured', applied: 0 })
        }

        let applied = 0

        for (const rule of rules) {
            const graceDays = rule.grace_period_days ?? 5
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - graceDays)
            const cutoffISO = cutoffDate.toISOString().split('T')[0]

            // Find unpaid payments past grace period for this rule
            const query = supabase
                .from('rent_payments')
                .select('id, amount')
                .eq('status', 'unpaid')
                .eq('late_fee_applied', false)
                .lt('due_date', cutoffISO)
                .eq('user_id', rule.user_id)

            // Filter by property if rule is property-specific
            if (rule.property_id) {
                query.eq('property_id', rule.property_id)
            }

            const { data: overduePayments } = await query

            if (!overduePayments?.length) continue

            for (const payment of overduePayments) {
                let lateFee: number
                if (rule.fee_type === 'percentage') {
                    lateFee = Number(payment.amount) * (Number(rule.fee_amount) / 100)
                } else {
                    lateFee = Number(rule.fee_amount)
                }

                const { error } = await supabase
                    .from('rent_payments')
                    .update({
                        late_fee_amount: lateFee,
                        late_fee_applied: true,
                    })
                    .eq('id', payment.id)

                if (!error) {
                    applied++
                    console.log(`Late fee $${lateFee} applied to payment ${payment.id}`)
                }
            }
        }

        return NextResponse.json({
            message: `Late fees processed`,
            applied,
            timestamp: new Date().toISOString(),
        })
    } catch (err) {
        console.error('Late fee cron error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Also allow GET for Vercel Cron (some cron configs use GET)
export async function GET(req: NextRequest) {
    return POST(req)
}

