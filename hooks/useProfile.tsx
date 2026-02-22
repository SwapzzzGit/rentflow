'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Profile = {
    id: string
    full_name: string | null
    phone: string | null
    company_name: string | null
    avatar_url: string | null
    timezone: string
    currency: string
    date_format: string
    email_notifications: {
        rent_due: boolean
        maintenance_update: boolean
        lease_expiry: boolean
        payment_received: boolean
    }
    plan: string
}

type ProfileContextValue = {
    profile: Profile | null
    email: string
    loading: boolean
    refetch: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue>({
    profile: null,
    email: '',
    loading: true,
    refetch: async () => { },
})

export function ProfileProvider({ children }: { children: ReactNode }) {
    const supabase = createClient()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(true)

    const fetchProfile = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        setEmail(user.email ?? '')

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (data) {
            setProfile({
                id: data.id,
                full_name: data.full_name ?? null,
                phone: data.phone ?? null,
                company_name: data.company_name ?? null,
                avatar_url: data.avatar_url ?? null,
                timezone: data.timezone ?? 'UTC',
                currency: data.currency ?? 'USD',
                date_format: data.date_format ?? 'MM/DD/YYYY',
                email_notifications: data.email_notifications ?? {
                    rent_due: true,
                    maintenance_update: true,
                    lease_expiry: true,
                    payment_received: true,
                },
                plan: data.plan ?? 'free',
            })
        } else {
            // Upsert a blank profile row if missing
            await supabase.from('profiles').upsert({ id: user.id })
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchProfile() }, [fetchProfile])

    return (
        <ProfileContext.Provider value={{ profile, email, loading, refetch: fetchProfile }}>
            {children}
        </ProfileContext.Provider>
    )
}

export function useProfile() {
    return useContext(ProfileContext)
}
