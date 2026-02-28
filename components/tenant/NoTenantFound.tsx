import React from 'react'
import { AlertCircle } from 'lucide-react'

export function NoTenantFound() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-2xl border border-black/5 shadow-sm p-10 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h1 className="text-xl font-bold text-[#0A0A0A] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                    Account setup incomplete
                </h1>
                <p className="text-sm text-[#888888] mb-8">
                    Your tenancy details haven't been linked yet. Please contact your landlord to complete setup.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-sm font-semibold text-[#E8392A] hover:opacity-80 transition"
                >
                    Check again
                </button>
            </div>
        </div>
    )
}
