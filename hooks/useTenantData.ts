import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useTenantData() {
    const supabase = createClient()
    const [tenant, setTenant] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchTenant() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setLoading(false)
                    return
                }

                const { data, error } = await supabase
                    .from('tenants')
                    .select('*, properties(*)')
                    .eq('portal_user_id', user.id)
                    .single()

                if (error) {
                    setError(error.message)
                } else {
                    setTenant(data)
                }
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchTenant()
    }, [])

    return { tenant, loading, error }
}
