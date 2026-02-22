import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' })

// IMPORTANT: Stripe requires the raw body for webhook signature verification.
// In Next.js App Router, we read the raw text body manually.
export async function POST(req: NextRequest) {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')

    if (!sig) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
        console.error('Webhook verification failed:', message)
        return NextResponse.json({ error: message }, { status: 400 })
    }

    const supabase = await createClient()

    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const pi = event.data.object as Stripe.PaymentIntent
                const rentPaymentId = pi.metadata?.rent_payment_id

                if (!rentPaymentId) break

                // Update rent payment to paid
                const { error } = await supabase
                    .from('rent_payments')
                    .update({
                        status: 'paid',
                        payment_method: 'stripe',
                        stripe_payment_intent_id: pi.id,
                        paid_date: new Date().toISOString(),
                    })
                    .eq('id', rentPaymentId)

                if (error) {
                    console.error('Failed to update rent payment:', error)
                } else {
                    console.log(`✓ Rent payment ${rentPaymentId} marked as paid via Stripe`)
                }
                break
            }

            case 'payment_intent.payment_failed': {
                const pi = event.data.object as Stripe.PaymentIntent
                console.error(`Payment failed: ${pi.id} — ${pi.last_payment_error?.message}`)
                // Note: tenant will see the error in the UI via Stripe Elements
                break
            }

            case 'account.updated': {
                const account = event.data.object as Stripe.Account
                const isOnboarded = account.charges_enabled && account.details_submitted

                await supabase
                    .from('profiles')
                    .update({ stripe_onboarded: isOnboarded })
                    .eq('stripe_account_id', account.id)

                console.log(`✓ Account ${account.id} onboarded: ${isOnboarded}`)
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }
    } catch (err) {
        console.error('Webhook handler error:', err)
        return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}

