import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // 'next' param allows callers to specify destination; default to /dashboard
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Determine where to send the user based on setup_completed
            const { data: { user } } = await supabase.auth.getUser()
            let destination = next

            if (user && next === '/dashboard') {
                // Only override when no explicit destination was set
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('setup_completed')
                    .eq('id', user.id)
                    .single()
                destination = profile?.setup_completed ? '/dashboard' : '/setup'
            }

            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${destination}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${destination}`)
            } else {
                return NextResponse.redirect(`${origin}${destination}`)
            }
        }
    }

    // Return the user to an error page if code exchange fails
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
