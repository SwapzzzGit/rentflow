import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' })

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { rentPaymentId } = await req.json()
        if (!rentPaymentId) {
            return NextResponse.json({ error: 'rentPaymentId is required' }, { status: 400 })
        }

        // Fetch the rent payment with tenant and property info
        const { data: payment, error: paymentError } = await supabase
            .from('rent_payments')
            .select(`
                id, amount, late_fee_amount, status, tenant_id,
                tenants (
                    id, full_name, email, stripe_customer_id,
                    properties (
                        id, user_id, address,
                        profiles!properties_user_id_fkey (
                            stripe_account_id, stripe_onboarded
                        )
                    )
                )
            `)
            .eq('id', rentPaymentId)
            .single()

        if (paymentError || !payment) {
            return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
        }

        if (payment.status === 'paid') {
            return NextResponse.json({ error: 'Payment already completed' }, { status: 400 })
        }

        const tenant = payment.tenants as any
        const property = tenant?.properties as any
        const landlordProfile = property?.profiles as any

        const totalAmount = (Number(payment.amount) + Number(payment.late_fee_amount || 0))
        const amountInCents = Math.round(totalAmount * 100)

        if (amountInCents < 50) {
            return NextResponse.json({ error: 'Amount too small' }, { status: 400 })
        }

        // Build PaymentIntent params
        const piParams: Stripe.PaymentIntentCreateParams = {
            amount: amountInCents,
            currency: 'usd',
            metadata: {
                rent_payment_id: rentPaymentId,
                tenant_id: tenant?.id || '',
                property_address: property?.address || '',
            },
        }

        // Add Connect transfer if landlord is onboarded
        if (landlordProfile?.stripe_account_id && landlordProfile?.stripe_onboarded) {
            const applicationFee = Math.round(amountInCents * 0.015) // 1.5% platform fee
            piParams.transfer_data = {
                destination: landlordProfile.stripe_account_id,
            }
            piParams.application_fee_amount = applicationFee
        }

        const paymentIntent = await stripe.paymentIntents.create(piParams)

        return NextResponse.json({ clientSecret: paymentIntent.client_secret })
    } catch (err: unknown) {
        console.error('Payment intent error:', err)
        const message = err instanceof Error ? err.message : 'Internal server error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

