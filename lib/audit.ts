import { createClient } from '@/lib/supabase/server'

export type AuditEvent =
    | 'SIGNING_REQUESTED'
    | 'LANDLORD_SIGNED'
    | 'TENANT_VIEWED'
    | 'TENANT_SIGNED'
    | 'PDF_GENERATED'
    | 'PDF_DOWNLOADED'

interface LogLeaseEventParams {
    leaseId: string
    event: AuditEvent
    actorName: string
    actorEmail: string
    ipAddress: string
    userAgent: string
    metadata?: Record<string, unknown>
}

export async function logLeaseEvent(params: LogLeaseEventParams): Promise<void> {
    const { leaseId, event, actorName, actorEmail, ipAddress, userAgent, metadata = {} } = params

    try {
        const supabase = await createClient()

        // Insert into dedicated audit log table
        await supabase.from('lease_audit_logs').insert({
            lease_id: leaseId,
            event,
            actor_name: actorName,
            actor_email: actorEmail,
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata,
        })

        // Also append to leases.audit_trail jsonb array as tamper-proof backup
        const newEntry = {
            event,
            actorName,
            actorEmail,
            ipAddress,
            userAgent,
            metadata,
            timestamp: new Date().toISOString(),
        }

        // Use raw SQL via rpc for atomic jsonb append
        await supabase.rpc('append_audit_trail', {
            p_lease_id: leaseId,
            p_entry: newEntry,
        }).then(({ error }) => {
            // If rpc doesn't exist, fall back to fetch-then-update
            if (error) {
                return supabase
                    .from('leases')
                    .select('audit_trail')
                    .eq('id', leaseId)
                    .single()
                    .then(({ data }) => {
                        const existing: unknown[] = (data as any)?.audit_trail || []
                        return supabase
                            .from('leases')
                            .update({ audit_trail: [...existing, newEntry] })
                            .eq('id', leaseId)
                    })
            }
        })
    } catch {
        // Audit logging failures should never crash the main flow
        console.error('[audit] logLeaseEvent failed for', leaseId, event)
    }
}
