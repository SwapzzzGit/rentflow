'use client'

import { useRef, useState, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Check, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

interface SignaturePadProps {
    onSave: (base64: string) => void
    onClear: () => void
    label: string
}

export function SignaturePad({ onSave, onClear, label }: SignaturePadProps) {
    const sigRef = useRef<SignatureCanvas>(null)
    const [savedSig, setSavedSig] = useState<string | null>(null)
    const [isEmpty, setIsEmpty] = useState(true)

    const handleSave = useCallback(() => {
        if (!sigRef.current || sigRef.current.isEmpty()) {
            toast.error('Please draw your signature first')
            return
        }
        const dataUrl = sigRef.current.toDataURL('image/png')
        setSavedSig(dataUrl)
        onSave(dataUrl)
        toast.success('Signature saved!')
    }, [onSave])

    const handleClear = useCallback(() => {
        sigRef.current?.clear()
        setSavedSig(null)
        setIsEmpty(true)
        onClear()
    }, [onClear])

    const handleBegin = useCallback(() => {
        setIsEmpty(false)
    }, [])

    if (savedSig) {
        return (
            <div>
                <p className="text-sm mb-2" style={{ color: 'var(--dash-muted, #6B7280)' }}>{label}</p>
                <div
                    className="relative rounded-2xl overflow-hidden flex items-center justify-center"
                    style={{
                        border: '2px solid rgba(34,197,94,0.4)',
                        background: 'rgba(34,197,94,0.04)',
                        minHeight: '120px',
                    }}
                >
                    {/* Signature image */}
                    <img
                        src={savedSig}
                        alt="Saved signature"
                        className="max-h-32 object-contain"
                        style={{ maxWidth: '100%' }}
                    />
                    {/* Green overlay indicator */}
                    <div
                        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#16A34A' }}
                    >
                        <Check className="w-3 h-3" />
                        Signature saved
                    </div>
                </div>
                <div className="flex gap-3 mt-3">
                    <button
                        type="button"
                        onClick={handleClear}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all hover:opacity-80"
                        style={{
                            border: '1px solid var(--dash-border, #E9EBF0)',
                            color: 'var(--dash-muted, #6B7280)',
                            background: 'transparent',
                        }}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Re-sign
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <p className="text-sm mb-2" style={{ color: 'var(--dash-muted, #6B7280)' }}>{label}</p>
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    border: '2px dashed var(--dash-border, #D1D5DB)',
                    background: 'var(--dash-card-bg, white)',
                }}
            >
                <SignatureCanvas
                    ref={sigRef}
                    onBegin={handleBegin}
                    penColor="#111827"
                    canvasProps={{
                        className: 'w-full touch-none cursor-crosshair',
                        style: { height: '180px', display: 'block' },
                    }}
                />
            </div>
            {isEmpty && (
                <p className="text-xs mt-1.5" style={{ color: '#9CA3AF' }}>
                    Draw your signature above using mouse or touch
                </p>
            )}
            <div className="flex gap-3 mt-3">
                <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-xl px-4 py-2 text-sm transition-all hover:opacity-80"
                    style={{
                        border: '1px solid var(--dash-border, #E9EBF0)',
                        color: 'var(--dash-muted, #6B7280)',
                        background: 'transparent',
                    }}
                >
                    Clear
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
                    style={{ background: '#E8392A' }}
                >
                    Save Signature
                </button>
            </div>
        </div>
    )
}
