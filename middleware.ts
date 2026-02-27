import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Build a Supabase server client scoped to this request
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()

    // ── /dashboard/* ─────────────────────────────────────────────────────────
    if (pathname.startsWith('/dashboard')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        return response
    }

    // ── /tenant/* ─────────────────────────────────────────────────────────────
    if (pathname.startsWith('/tenant')) {
        // Public: tenant auth pages
        const publicTenantPages = ['/tenant/login', '/tenant/forgot-password', '/tenant/set-password']
        if (publicTenantPages.includes(pathname) || pathname.startsWith('/tenant/login?')) {
            return response
        }
        // Protected: all other /tenant/* pages
        if (!session) {
            return NextResponse.redirect(new URL('/tenant/login', request.url))
        }
        return response
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
