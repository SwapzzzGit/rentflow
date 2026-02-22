import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' })

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('account_id')

    if (!accountId) {
        return NextResponse.redirect(new URL('/dashboard/settings?tab=billing&error=missing_account', req.url))
    }

    try {
        // Verify the account status with Stripe
        const account = await stripe.accounts.retrieve(accountId)
        const isOnboarded = account.charges_enabled && account.details_submitted

        const supabase = await createClient()

        // Update the profile — match by stripe_account_id
        await supabase
            .from('profiles')
            .update({
                stripe_onboarded: isOnboarded,
                stripe_account_id: accountId,
            })
            .eq('stripe_account_id', accountId)

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const status = isOnboarded ? 'connected' : 'pending'
        return NextResponse.redirect(new URL(`/dashboard/settings?tab=billing&stripe=${status}`, appUrl))
    } catch (err) {
        console.error('Stripe callback error:', err)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        return NextResponse.redirect(new URL('/dashboard/settings?tab=billing&error=stripe_error', appUrl))
    }
}

