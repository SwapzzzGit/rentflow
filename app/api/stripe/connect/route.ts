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

        // Check if landlord already has a connected account
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_account_id, stripe_onboarded')
            .eq('id', user.id)
            .single()

        let accountId = profile?.stripe_account_id

        if (!accountId) {
            // Create a new Express connected account
            const account = await stripe.accounts.create({
                type: 'express',
                metadata: { user_id: user.id },
            })
            accountId = account.id

            // Store the account ID
            await supabase
                .from('profiles')
                .update({ stripe_account_id: accountId, stripe_onboarded: false })
                .eq('id', user.id)
        }

        // Create an account link for onboarding
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${appUrl}/api/stripe/connect`,
            return_url: `${appUrl}/api/stripe/connect/callback?account_id=${accountId}`,
            type: 'account_onboarding',
        })

        return NextResponse.json({ url: accountLink.url })
    } catch (err: unknown) {
        console.error('Stripe Connect error:', err)
        const message = err instanceof Error ? err.message : 'Internal server error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

