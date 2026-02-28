import React from 'react'

export function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-100 animate-pulse rounded" />
                    <div className="h-8 w-32 bg-gray-100 animate-pulse rounded" />
                </div>
                <div className="w-10 h-10 bg-gray-100 animate-pulse rounded-xl" />
            </div>
            <div className="h-4 w-48 bg-gray-100 animate-pulse rounded" />
        </div>
    )
}
