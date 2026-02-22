import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'
import { sendSignedLeaseToAll } from '@/lib/email/resend'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { token, signature } = await req.json()

        if (!token || !signature) {
            return NextResponse.json({ error: 'token and signature required' }, { status: 400 })
        }
        if (!signature.startsWith('data:image/png;base64,')) {
            return NextResponse.json({ error: 'Invalid signature format' }, { status: 400 })
        }

        // Validate token
        const { data: lease, error: leaseErr } = await supabase
            .from('leases')
            .select(`
        id, status, signing_token, tenant_id, user_id,
        start_date, end_date, rent_amount, document_url,
        landlord_signature, landlord_signed_at,
        property:properties(name, address),
        tenant:tenants(full_name, email)
      `)
            .eq('signing_token', token)
            .eq('status', 'pending_tenant')
            .single()

        if (leaseErr || !lease) {
            return NextResponse.json({ error: 'Invalid or expired signing link' }, { status: 404 })
        }

        const now = new Date().toISOString()

        // Save tenant signature + mark as signed
        const { error: updateErr } = await supabase
            .from('leases')
            .update({
                tenant_signature: signature,
                tenant_signed_at: now,
                signed_at: now,
                status: 'signed',
            })
            .eq('id', lease.id)

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

        // Generate signed PDF
        const pdfBytes = await generateSignedPDF(supabase, lease, signature, now)

        // Upload to Supabase Storage
        const storagePath = `signed/${lease.id}/signed-lease.pdf`
        const { error: uploadErr } = await supabase.storage
            .from('lease-documents')
            .upload(storagePath, pdfBytes, {
                contentType: 'application/pdf',
                upsert: true,
            })

        if (!uploadErr) {
            await supabase
                .from('leases')
                .update({ signed_pdf_url: storagePath })
                .eq('id', lease.id)
        }

        // Get landlord profile
        const { data: landlordProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', lease.user_id)
            .single()

        // Get signed PDF URL for email
        let pdfDownloadUrl = ''
        if (!uploadErr) {
            const { data: signedUrlData } = await supabase.storage
                .from('lease-documents')
                .createSignedUrl(storagePath, 7 * 24 * 3600) // 7 days for email
            pdfDownloadUrl = signedUrlData?.signedUrl || ''
        }

        const tenant = (lease as any).tenant
        const property = (lease as any).property

        // Send signed PDF to both parties
        if (tenant?.email && landlordProfile?.email) {
            await sendSignedLeaseToAll({
                landlordName: landlordProfile.full_name || 'Landlord',
                landlordEmail: landlordProfile.email,
                tenantName: tenant.full_name,
                tenantEmail: tenant.email,
                propertyName: property?.name || 'Property',
                signedAt: new Date(now).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                pdfUrl: pdfDownloadUrl,
            })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('tenant-sign error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

async function generateSignedPDF(supabase: any, lease: any, tenantSignature: string, signedAt: string): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create()
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // If there's an existing lease document, try to embed it
    if (lease.document_url) {
        try {
            // Get a signed URL since bucket is private
            const { data: signedData } = await supabase.storage
                .from('lease-documents')
                .createSignedUrl(lease.document_url, 60)
            const fetchUrl = signedData?.signedUrl || lease.document_url
            const res = await fetch(fetchUrl)
            if (res.ok) {
                const existingPdfBytes = await res.arrayBuffer()
                const existingPdf = await PDFDocument.load(existingPdfBytes)
                const copiedPages = await pdfDoc.copyPages(existingPdf, existingPdf.getPageIndices())
                copiedPages.forEach(page => pdfDoc.addPage(page))
            } else {
                addLeaseSummaryPage(pdfDoc, lease, helvetica, helveticaBold)
            }
        } catch {
            // If fetch fails, create summary page instead
            addLeaseSummaryPage(pdfDoc, lease, helvetica, helveticaBold)
        }
    } else {
        // No original doc — create lease summary page
        addLeaseSummaryPage(pdfDoc, lease, helvetica, helveticaBold)
    }

    // Add signature page
    await addSignaturePage(pdfDoc, lease, tenantSignature, signedAt, helvetica, helveticaBold)

    return pdfDoc.save()
}

function addLeaseSummaryPage(pdfDoc: PDFDocument, lease: any, font: any, boldFont: any) {
    const page = pdfDoc.addPage([595, 842]) // A4
    const { width, height } = page.getSize()

    // Header background
    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: rgb(0.91, 0.22, 0.16) })

    // Logo text
    page.drawText('RentFlow', { x: 40, y: height - 52, size: 24, font: boldFont, color: rgb(1, 1, 1) })
    page.drawText('LEASE AGREEMENT', { x: 40, y: height - 72, size: 10, font, color: rgb(1, 0.8, 0.8) })

    const property = lease.property
    const tenant = lease.tenant
    const startDate = new Date(lease.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const endDate = new Date(lease.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    let y = height - 130
    const drawRow = (label: string, value: string) => {
        page.drawText(label, { x: 40, y, size: 10, font, color: rgb(0.42, 0.45, 0.5) })
        page.drawText(value, { x: 200, y, size: 10, font: boldFont, color: rgb(0.07, 0.07, 0.07) })
        y -= 24
    }

    page.drawText('LEASE DETAILS', { x: 40, y, size: 11, font: boldFont, color: rgb(0.07, 0.07, 0.07) })
    y -= 20
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.91, 0.93, 0.94) })
    y -= 24

    drawRow('Property', property?.name || '—')
    drawRow('Address', property?.address || '—')
    drawRow('Tenant', tenant?.full_name || '—')
    drawRow('Start Date', startDate)
    drawRow('End Date', endDate)
    drawRow('Monthly Rent', `$${Number(lease.rent_amount || 0).toLocaleString()}`)
}

async function addSignaturePage(
    pdfDoc: PDFDocument,
    lease: any,
    tenantSignature: string,
    signedAt: string,
    font: any,
    boldFont: any,
) {
    const page = pdfDoc.addPage([595, 842])
    const { width, height } = page.getSize()

    // Watermark — SIGNED diagonal
    page.drawText('SIGNED', {
        x: 130, y: height / 2 - 60,
        size: 100,
        font: boldFont,
        color: rgb(0.85, 0.9, 0.85),
        rotate: degrees(45),
    })

    // Header
    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: rgb(0.91, 0.22, 0.16) })
    page.drawText('RentFlow', { x: 40, y: height - 52, size: 24, font: boldFont, color: rgb(1, 1, 1) })
    page.drawText('SIGNED LEASE — BOTH PARTIES HAVE SIGNED', { x: 40, y: height - 72, size: 9, font, color: rgb(1, 0.8, 0.8) })

    const property = lease.property
    const tenant = lease.tenant

    // Property details box
    let y = height - 130
    page.drawText('PROPERTY & PARTIES', { x: 40, y, size: 10, font: boldFont, color: rgb(0.07, 0.07, 0.07) })
    y -= 16
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.91, 0.93, 0.94) })
    y -= 18

    const drawInfo = (label: string, value: string) => {
        page.drawText(label + ':', { x: 40, y, size: 9, font, color: rgb(0.42, 0.45, 0.5) })
        page.drawText(value, { x: 200, y, size: 9, font: boldFont, color: rgb(0.07, 0.07, 0.07) })
        y -= 18
    }
    drawInfo('Property', property?.name || '—')
    drawInfo('Address', property?.address || '—')
    drawInfo('Tenant', tenant?.full_name || '—')
    const start = new Date(lease.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const end = new Date(lease.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    drawInfo('Lease Period', `${start} — ${end}`)
    drawInfo('Monthly Rent', `$${Number(lease.rent_amount || 0).toLocaleString()}`)

    // Signatures section
    y -= 20
    page.drawText('SIGNATURES', { x: 40, y, size: 10, font: boldFont, color: rgb(0.07, 0.07, 0.07) })
    y -= 16
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.91, 0.93, 0.94) })
    y -= 20

    const sigBoxY = y - 80
    const sigBoxH = 90

    // Landlord signature box
    page.drawRectangle({ x: 40, y: sigBoxY, width: 220, height: sigBoxH, borderColor: rgb(0.85, 0.87, 0.9), borderWidth: 1, color: rgb(0.98, 0.98, 0.99) })
    page.drawText('LANDLORD', { x: 52, y: sigBoxY + sigBoxH - 16, size: 8, font: boldFont, color: rgb(0.42, 0.45, 0.5) })

    if (lease.landlord_signature) {
        try {
            const b64 = lease.landlord_signature.replace('data:image/png;base64,', '')
            const imgBytes = Buffer.from(b64, 'base64')
            const img = await pdfDoc.embedPng(imgBytes)
            const dims = img.scale(0.45)
            page.drawImage(img, { x: 52, y: sigBoxY + 12, width: Math.min(dims.width, 190), height: Math.min(dims.height, 55) })
        } catch { /* skip if image fails */ }
    }

    if (lease.landlord_signed_at) {
        const landDate = new Date(lease.landlord_signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        page.drawText(`Signed: ${landDate}`, { x: 52, y: sigBoxY - 14, size: 8, font, color: rgb(0.42, 0.45, 0.5) })
    }

    // Tenant signature box
    page.drawRectangle({ x: 335, y: sigBoxY, width: 220, height: sigBoxH, borderColor: rgb(0.85, 0.87, 0.9), borderWidth: 1, color: rgb(0.98, 0.98, 0.99) })
    page.drawText('TENANT', { x: 347, y: sigBoxY + sigBoxH - 16, size: 8, font: boldFont, color: rgb(0.42, 0.45, 0.5) })

    try {
        const b64 = tenantSignature.replace('data:image/png;base64,', '')
        const imgBytes = Buffer.from(b64, 'base64')
        const img = await pdfDoc.embedPng(imgBytes)
        const dims = img.scale(0.45)
        page.drawImage(img, { x: 347, y: sigBoxY + 12, width: Math.min(dims.width, 190), height: Math.min(dims.height, 55) })
    } catch { /* skip if image fails */ }

    const tenantDate = new Date(signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    page.drawText(`Signed: ${tenantDate}`, { x: 347, y: sigBoxY - 14, size: 8, font, color: rgb(0.42, 0.45, 0.5) })
    page.drawText(tenant?.full_name || '', { x: 347, y: sigBoxY - 26, size: 8, font: boldFont, color: rgb(0.07, 0.07, 0.07) })

    // Footer
    const footerText = `This document was digitally signed via RentFlow on ${new Date(signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Electronic signatures are legally binding.`
    page.drawLine({ start: { x: 40, y: 60 }, end: { x: width - 40, y: 60 }, thickness: 1, color: rgb(0.91, 0.93, 0.94) })
    page.drawText(footerText, { x: 40, y: 42, size: 8, font, color: rgb(0.62, 0.65, 0.70), maxWidth: width - 80 })
}
