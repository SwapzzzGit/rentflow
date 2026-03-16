import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    // 'next' param allows callers to specify destination; default logic follows setup_completed
    const nextParam = requestUrl.searchParams.get('next')

    if (code) {
        const supabase = await createClient()
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (!exchangeError) {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // If a non-dashboard 'next' was provided, respect it (e.g. /setup, /tenant/dashboard)
                if (nextParam && nextParam !== '/dashboard' && !nextParam.startsWith('/dashboard/')) {
                    return NextResponse.redirect(`${requestUrl.origin}${nextParam}`)
                }

                // Otherwise, check setup_completed
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('setup_completed')
                    .eq('id', user.id)
                    .single()

                const destination = profile?.setup_completed ? '/dashboard' : '/setup'
                return NextResponse.redirect(`${requestUrl.origin}${destination}`)
            }
        }
    }

    // Fallback: something went wrong, send to login
    return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_error`)
}
