import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'
import { sendSignedLeaseToAll } from '@/lib/email/resend'
import { getClientInfo } from '@/lib/get-client-info'
import { logLeaseEvent } from '@/lib/audit'

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

        // Extract client IP and user agent
        const { ipAddress, userAgent } = getClientInfo(req)

        // Validate token
        const { data: lease, error: leaseErr } = await supabase
            .from('leases')
            .select(`
        id, status, signing_token, tenant_id, user_id,
        start_date, end_date, rent_amount, document_url,
        landlord_signature, landlord_signed_at,
        landlord_ip, landlord_user_agent,
        signing_requested_at,
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

        // Save tenant signature + mark as signed + store tenant IP
        const { error: updateErr } = await supabase
            .from('leases')
            .update({
                tenant_signature: signature,
                tenant_signed_at: now,
                signed_at: now,
                status: 'signed',
                tenant_ip: ipAddress,
                tenant_user_agent: userAgent,
            })
            .eq('id', lease.id)

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

        const tenant = (lease as any).tenant

        // Log TENANT_SIGNED audit event
        await logLeaseEvent({
            leaseId: lease.id,
            event: 'TENANT_SIGNED',
            actorName: tenant?.full_name || 'Tenant',
            actorEmail: tenant?.email || '',
            ipAddress,
            userAgent,
            metadata: { signedAt: now, tokenUsed: token },
        })

        // Fetch audit log for PDF
        const { data: auditLogs } = await supabase
            .from('lease_audit_logs')
            .select('event, actor_name, actor_email, ip_address, created_at')
            .eq('lease_id', lease.id)
            .order('created_at', { ascending: true })

        // Generate signed PDF (with audit trail page)
        const pdfBytes = await generateSignedPDF(supabase, lease, signature, now, ipAddress, auditLogs || [])

        // Log PDF_GENERATED event
        await logLeaseEvent({
            leaseId: lease.id,
            event: 'PDF_GENERATED',
            actorName: 'System',
            actorEmail: 'RentFlow',
            ipAddress: 'Server',
            userAgent: 'RentFlow/PDF-Generator',
            metadata: { generatedAt: new Date().toISOString() },
        })

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

        const property = (lease as any).property

        // Send signed PDF to both parties (with audit summary)
        if (tenant?.email && landlordProfile?.email) {
            await sendSignedLeaseToAll({
                landlordName: landlordProfile.full_name || 'Landlord',
                landlordEmail: landlordProfile.email,
                tenantName: tenant.full_name,
                tenantEmail: tenant.email,
                propertyName: property?.name || 'Property',
                signedAt: new Date(now).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                pdfUrl: pdfDownloadUrl,
                landlordIp: (lease as any).landlord_ip || 'N/A',
                tenantIp: ipAddress,
                leaseId: lease.id,
            })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('tenant-sign error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

async function generateSignedPDF(
    supabase: any,
    lease: any,
    tenantSignature: string,
    signedAt: string,
    tenantIp: string,
    auditLogs: Array<{ event: string; actor_name: string; actor_email: string; ip_address: string; created_at: string }>,
): Promise<Uint8Array> {
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

    // Add audit trail page
    await addAuditTrailPage(pdfDoc, lease, auditLogs, signedAt, tenantIp, helvetica, helveticaBold)

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

async function addAuditTrailPage(
    pdfDoc: PDFDocument,
    lease: any,
    auditLogs: Array<{ event: string; actor_name: string; actor_email: string; ip_address: string; created_at: string }>,
    signedAt: string,
    tenantIp: string,
    font: any,
    boldFont: any,
) {
    const page = pdfDoc.addPage([595, 842])
    const { width, height } = page.getSize()

    // Red header
    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: rgb(0.91, 0.22, 0.16) })
    page.drawText('RentFlow', { x: 40, y: height - 50, size: 20, font: boldFont, color: rgb(1, 1, 1) })
    page.drawText('ELECTRONIC SIGNATURE AUDIT TRAIL', { x: 40, y: height - 70, size: 9, font, color: rgb(1, 0.8, 0.8) })

    let y = height - 110

    // Title block
    page.drawText('AUDIT TRAIL CERTIFICATE', { x: 40, y, size: 14, font: boldFont, color: rgb(0.07, 0.07, 0.07) })
    y -= 18
    page.drawText('This document certifies the electronic signing of the above lease agreement.', {
        x: 40, y, size: 9, font, color: rgb(0.42, 0.45, 0.5), maxWidth: width - 80,
    })
    y -= 20

    // Divider
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.85, 0.87, 0.9) })
    y -= 18

    // Column headers
    const col = { event: 40, party: 165, email: 280, ip: 390, time: 465 }
    const drawHeader = (text: string, x: number) => {
        page.drawText(text, { x, y, size: 7.5, font: boldFont, color: rgb(0.42, 0.45, 0.5) })
    }
    drawHeader('EVENT', col.event)
    drawHeader('PARTY', col.party)
    drawHeader('EMAIL', col.email)
    drawHeader('IP ADDRESS', col.ip)
    drawHeader('TIMESTAMP (UTC)', col.time)
    y -= 14

    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.85, 0.87, 0.9) })
    y -= 14

    // Map friendly event names
    const eventLabelMap: Record<string, string> = {
        SIGNING_REQUESTED: 'Signing Requested',
        LANDLORD_SIGNED: 'Landlord Signed',
        TENANT_VIEWED: 'Tenant Viewed',
        TENANT_SIGNED: 'Tenant Signed',
        PDF_GENERATED: 'PDF Generated',
        PDF_DOWNLOADED: 'PDF Downloaded',
    }

    const drawRow = (event: string, party: string, email: string, ip: string, ts: string) => {
        const label = eventLabelMap[event] || event
        page.drawText(label, { x: col.event, y, size: 8, font: boldFont, color: rgb(0.07, 0.07, 0.07), maxWidth: 120 })
        page.drawText(party, { x: col.party, y, size: 8, font, color: rgb(0.13, 0.13, 0.13), maxWidth: 110 })
        page.drawText(email, { x: col.email, y, size: 7, font, color: rgb(0.42, 0.45, 0.5), maxWidth: 105 })
        page.drawText(ip, { x: col.ip, y, size: 7.5, font, color: rgb(0.42, 0.45, 0.5), maxWidth: 70 })
        page.drawText(ts, { x: col.time, y, size: 7, font, color: rgb(0.42, 0.45, 0.5), maxWidth: 90 })
        y -= 18
        page.drawLine({ start: { x: 40, y: y + 4 }, end: { x: width - 40, y: y + 4 }, thickness: 0.3, color: rgb(0.93, 0.94, 0.96) })
        y -= 4
    }

    // Draw each audit log entry
    for (const log of auditLogs) {
        const ts = new Date(log.created_at).toUTCString().replace('GMT', 'UTC')
        drawRow(log.event, log.actor_name, log.actor_email, log.ip_address || 'N/A', ts)
    }

    // Add PDF generated row explicitly (current moment)
    const pdfTs = new Date().toUTCString().replace('GMT', 'UTC')
    drawRow('PDF_GENERATED', 'System', 'RentFlow', 'Server', pdfTs)

    y -= 10
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.85, 0.87, 0.9) })
    y -= 20

    // Legal text block
    const legalText = `This audit trail certifies that the above parties electronically signed this document. Electronic signatures are legally binding under the Information Technology Act 2000 (India) and the Electronic Signatures in Global and National Commerce Act (ESIGN Act) 2000 (USA). Document ID: ${lease.id}. Generated by RentFlow.`
    page.drawText(legalText, {
        x: 40, y,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.35),
        maxWidth: width - 80,
        lineHeight: 13,
    })

    // Footer
    page.drawLine({ start: { x: 40, y: 50 }, end: { x: width - 40, y: 50 }, thickness: 0.5, color: rgb(0.91, 0.93, 0.94) })
    page.drawText('Powered by RentFlow — rentflow-virid.vercel.app', {
        x: 40, y: 35, size: 8, font, color: rgb(0.62, 0.65, 0.70),
    })
    page.drawText(`Document ID: ${lease.id}`, {
        x: 40, y: 22, size: 7, font, color: rgb(0.75, 0.77, 0.80),
    })
}
