import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'RentFlow <noreply@n8ncloud.one>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rentflow-virid.vercel.app'

// ─── Shared HTML template wrapper ────────────────────────────────────────────
function emailWrapper(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RentFlow</title>
</head>
<body style="margin:0;padding:0;background:#F6F8FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F8FA;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#E8392A;padding:24px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(255,255,255,0.2);width:32px;height:32px;border-radius:8px;text-align:center;vertical-align:middle;">
                  <span style="color:white;font-weight:bold;font-size:16px;">R</span>
                </td>
                <td style="padding-left:10px;">
                  <span style="color:white;font-weight:700;font-size:18px;letter-spacing:-0.5px;">RentFlow</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;background:#F9FAFB;border-top:1px solid #E9EBF0;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
              RentFlow · Property Management Platform<br/>
              <a href="${APP_URL}" style="color:#E8392A;">rentflow-virid.vercel.app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#E8392A;color:white;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">${text}</a>`
}

// ─── Email sending functions ──────────────────────────────────────────────────

export async function sendRentDueReminder(params: {
  tenantEmail: string
  tenantName: string
  propertyAddress: string
  amount: number
  dueDate: string
  rentPaymentId: string
}) {
  const { tenantEmail, tenantName, propertyAddress, amount, dueDate, rentPaymentId } = params
  const payUrl = `${APP_URL}/tenant/rent/pay?id=${rentPaymentId}`
  const dueDateFormatted = new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const html = emailWrapper(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">Rent Due in 3 Days</h2>
        <p style="margin:0 0 20px;color:#6B7280;font-size:15px;">Hi ${tenantName}, your rent is coming up soon.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;padding:20px;margin-bottom:8px;">
          <tr><td><p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#9CA3AF;">Property</p><p style="margin:0;font-size:15px;font-weight:600;color:#111;">${propertyAddress}</p></td></tr>
          <tr><td style="padding-top:16px;"><p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#9CA3AF;">Amount Due</p><p style="margin:0;font-size:24px;font-weight:700;color:#E8392A;">$${Number(amount).toLocaleString()}</p></td></tr>
          <tr><td style="padding-top:16px;"><p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#9CA3AF;">Due Date</p><p style="margin:0;font-size:15px;font-weight:600;color:#111;">${dueDateFormatted}</p></td></tr>
        </table>
        ${ctaButton('Pay Rent Online', payUrl)}
    `)

  return resend.emails.send({
    from: FROM,
    to: tenantEmail,
    subject: `Rent Due ${dueDateFormatted} — $${Number(amount).toLocaleString()}`,
    html,
  })
}

export async function sendPaymentReceived(params: {
  tenantEmail: string
  tenantName: string
  amount: number
  month: string
  propertyAddress: string
}) {
  const { tenantEmail, tenantName, amount, month, propertyAddress } = params

  const html = emailWrapper(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">Payment Confirmed ✓</h2>
        <p style="margin:0 0 20px;color:#6B7280;font-size:15px;">Hi ${tenantName}, we've received your rent payment.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:12px;padding:20px;margin-bottom:8px;border:1px solid #BBF7D0;">
          <tr><td><p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#16A34A;">Amount Received</p><p style="margin:0;font-size:28px;font-weight:700;color:#16A34A;">$${Number(amount).toLocaleString()}</p></td></tr>
          <tr><td style="padding-top:16px;"><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Property</p><p style="margin:0;font-size:14px;font-weight:600;color:#111;">${propertyAddress}</p></td></tr>
          <tr><td style="padding-top:8px;"><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Period</p><p style="margin:0;font-size:14px;font-weight:600;color:#111;">${month}</p></td></tr>
        </table>
        ${ctaButton('View Rent History', `${APP_URL}/tenant/rent`)}
    `)

  return resend.emails.send({
    from: FROM,
    to: tenantEmail,
    subject: `Payment Received — $${Number(amount).toLocaleString()} for ${month}`,
    html,
  })
}

export async function sendLeaseExpiryAlert(params: {
  recipientEmail: string
  recipientName: string
  tenantName: string
  propertyAddress: string
  daysLeft: number
  expiryDate: string
  isLandlord?: boolean
}) {
  const { recipientEmail, recipientName, tenantName, propertyAddress, daysLeft, expiryDate, isLandlord } = params
  const expiryFormatted = new Date(expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const urgency = daysLeft <= 30 ? '#E8392A' : '#CA8A04'
  const viewUrl = isLandlord ? `${APP_URL}/dashboard/leases` : `${APP_URL}/tenant/lease`

  const html = emailWrapper(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">Lease Expiring in ${daysLeft} Days</h2>
        <p style="margin:0 0 20px;color:#6B7280;font-size:15px;">Hi ${recipientName}, this is a reminder about an upcoming lease expiry.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border-radius:12px;padding:20px;margin-bottom:8px;border:1px solid #FDE68A;">
          <tr><td><p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#CA8A04;">Days Remaining</p><p style="margin:0;font-size:36px;font-weight:700;color:${urgency};">${daysLeft}</p></td></tr>
          <tr><td style="padding-top:16px;"><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Property</p><p style="margin:0;font-size:14px;font-weight:600;color:#111;">${propertyAddress}</p></td></tr>
          ${isLandlord ? `<tr><td style="padding-top:8px;"><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Tenant</p><p style="margin:0;font-size:14px;font-weight:600;color:#111;">${tenantName}</p></td></tr>` : ''}
          <tr><td style="padding-top:8px;"><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Expiry Date</p><p style="margin:0;font-size:14px;font-weight:600;color:#111;">${expiryFormatted}</p></td></tr>
        </table>
        ${ctaButton('View Lease', viewUrl)}
    `)

  return resend.emails.send({
    from: FROM,
    to: recipientEmail,
    subject: `Lease Expiry Alert — ${daysLeft} days left (${propertyAddress})`,
    html,
  })
}

export async function sendMaintenanceUpdate(params: {
  tenantEmail: string
  tenantName: string
  ticketTitle: string
  newStatus: string
  propertyAddress: string
  ticketId: string
}) {
  const { tenantEmail, tenantName, ticketTitle, newStatus, propertyAddress, ticketId } = params
  const statusLabel = newStatus === 'in_progress' ? 'In Progress' : newStatus === 'resolved' ? 'Resolved ✓' : newStatus
  const statusColor = newStatus === 'resolved' ? '#16A34A' : '#2563EB'
  const viewUrl = `${APP_URL}/tenant/maintenance`

  const html = emailWrapper(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">Maintenance Update</h2>
        <p style="margin:0 0 20px;color:#6B7280;font-size:15px;">Hi ${tenantName}, your maintenance request has been updated.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;padding:20px;margin-bottom:8px;">
          <tr><td><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Request</p><p style="margin:0;font-size:15px;font-weight:600;color:#111;">${ticketTitle}</p></td></tr>
          <tr><td style="padding-top:12px;"><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">New Status</p><p style="margin:0;font-size:15px;font-weight:700;color:${statusColor};">${statusLabel}</p></td></tr>
          <tr><td style="padding-top:12px;"><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Property</p><p style="margin:0;font-size:14px;color:#374151;">${propertyAddress}</p></td></tr>
        </table>
        ${ctaButton('View Request', viewUrl)}
    `)

  return resend.emails.send({
    from: FROM,
    to: tenantEmail,
    subject: `Maintenance Update: ${ticketTitle} — ${statusLabel}`,
    html,
  })
}

export async function sendLateFeNotice(params: {
  tenantEmail: string
  tenantName: string
  propertyAddress: string
  lateFeeAmount: number
  totalAmount: number
  rentPaymentId: string
}) {
  const { tenantEmail, tenantName, propertyAddress, lateFeeAmount, totalAmount, rentPaymentId } = params
  const payUrl = `${APP_URL}/tenant/rent/pay?id=${rentPaymentId}`

  const html = emailWrapper(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#E8392A;">Late Fee Applied</h2>
        <p style="margin:0 0 20px;color:#6B7280;font-size:15px;">Hi ${tenantName}, a late fee has been added to your overdue rent payment.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5F5;border-radius:12px;padding:20px;margin-bottom:8px;border:1px solid #FECACA;">
          <tr><td><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Property</p><p style="margin:0;font-size:14px;font-weight:600;color:#111;">${propertyAddress}</p></td></tr>
          <tr><td style="padding-top:12px;"><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Late Fee Added</p><p style="margin:0;font-size:18px;font-weight:700;color:#E8392A;">+$${Number(lateFeeAmount).toLocaleString()}</p></td></tr>
          <tr><td style="padding-top:12px;"><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Total Now Due</p><p style="margin:0;font-size:24px;font-weight:700;color:#111;">$${Number(totalAmount).toLocaleString()}</p></td></tr>
        </table>
        ${ctaButton('Pay Now', payUrl)}
    `)

  return resend.emails.send({
    from: FROM,
    to: tenantEmail,
    subject: `Late Fee Applied — $${Number(lateFeeAmount).toLocaleString()} added to your rent`,
    html,
  })
}

export async function sendTenantPortalInvite(params: {
  tenantName: string
  tenantEmail: string
  landlordName: string
  propertyName: string
  inviteUrl: string
}) {
  const { tenantName, tenantEmail, landlordName, propertyName, inviteUrl } = params

  const html = emailWrapper(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">You've been invited to RentFlow</h2>
        <p style="margin:0 0 20px;color:#6B7280;font-size:15px;">Hi ${tenantName}, <strong>${landlordName}</strong> has invited you to manage your tenancy online.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;padding:20px;margin-bottom:8px;border:1px solid #E9EBF0;">
          <tr><td><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Property</p><p style="margin:0;font-size:15px;font-weight:600;color:#111;">${propertyName}</p></td></tr>
          <tr><td style="padding-top:16px;"><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Your landlord</p><p style="margin:0;font-size:14px;font-weight:600;color:#111;">${landlordName}</p></td></tr>
        </table>
        <p style="margin:16px 0 8px;font-size:13px;color:#6B7280;">With RentFlow you can: pay rent online, submit maintenance requests with photos, view your lease, and track your payment history — all from your phone.</p>
        ${ctaButton('Accept Invite & Set Up Account', inviteUrl)}
        <p style="margin:16px 0 0;font-size:12px;color:#9CA3AF;">This invite link expires in 7 days. If you didn't expect this email, you can ignore it.</p>
    `)

  return resend.emails.send({
    from: FROM,
    to: tenantEmail,
    subject: `You've been invited to manage your tenancy on RentFlow`,
    html,
  })
}

export async function sendLeaseSigningRequest(params: {
  tenantName: string
  tenantEmail: string
  landlordName: string
  propertyName: string
  leaseStartDate: string
  leaseEndDate: string
  monthlyRent: number
  signingUrl: string
}) {
  const { tenantName, tenantEmail, landlordName, propertyName, signingUrl } = params

  const html = emailWrapper(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">Action Required: Sign Your Lease</h2>
        <p style="margin:0 0 20px;color:#6B7280;font-size:15px;">Hi ${tenantName}, <strong>${landlordName}</strong> has sent a lease agreement for <strong>${propertyName}</strong> that requires your digital signature.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;padding:20px;margin-bottom:8px;border:1px solid #E9EBF0;">
          <tr><td><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Property</p><p style="margin:0;font-size:15px;font-weight:600;color:#111;">${propertyName}</p></td></tr>
          <tr><td style="padding-top:12px;"><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Sent by</p><p style="margin:0;font-size:14px;font-weight:600;color:#111;">${landlordName}</p></td></tr>
        </table>
        <p style="margin:16px 0 8px;font-size:13px;color:#6B7280;">Your landlord has already signed this lease. Click below to review the lease details and add your signature to complete the agreement.</p>
        ${ctaButton('Review & Sign Lease', signingUrl)}
        <p style="margin:16px 0 0;font-size:12px;color:#9CA3AF;">This link is unique to you. After signing, both parties will receive a copy of the fully executed lease. If you did not expect this email, you can ignore it.</p>
    `)

  return resend.emails.send({
    from: FROM,
    to: tenantEmail,
    subject: `Action Required: Please sign your lease for ${propertyName}`,
    html,
  })
}

export async function sendSignedLeaseToAll(params: {
  landlordName: string
  landlordEmail: string
  tenantName: string
  tenantEmail: string
  propertyName: string
  signedAt: string
  pdfUrl: string
  landlordIp?: string
  tenantIp?: string
  leaseId?: string
}) {
  const { landlordName, landlordEmail, tenantName, tenantEmail, propertyName, signedAt, pdfUrl, landlordIp, tenantIp, leaseId } = params

  const auditSummaryHtml = (landlordIp || tenantIp || leaseId) ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F9FF;border-radius:12px;padding:16px;margin-top:16px;border:1px solid #BAE6FD;">
          <tr><td><p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#0284C7;">Audit Summary</p></td></tr>
          ${landlordIp ? `<tr><td><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Landlord signed</p><p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111;">${signedAt} · IP: ${landlordIp}</p></td></tr>` : ''}
          ${tenantIp ? `<tr><td><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Tenant signed</p><p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111;">${signedAt} · IP: ${tenantIp}</p></td></tr>` : ''}
          ${leaseId ? `<tr><td><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Document ID</p><p style="margin:0;font-size:11px;font-family:monospace;color:#374151;">${leaseId}</p></td></tr>` : ''}
        </table>
        <p style="margin:8px 0 0;font-size:11px;color:#9CA3AF;">This audit summary serves as additional proof of signing. Full audit trail is embedded in the signed PDF.</p>
  ` : ''

  const makeHtml = (recipientName: string) => emailWrapper(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">Lease Fully Signed ✓</h2>
        <p style="margin:0 0 20px;color:#6B7280;font-size:15px;">Hi ${recipientName}, the lease agreement for <strong>${propertyName}</strong> has been signed by both parties.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:12px;padding:20px;margin-bottom:8px;border:1px solid #BBF7D0;">
          <tr><td><p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#16A34A;">Fully Executed</p><p style="margin:0;font-size:15px;font-weight:700;color:#15803D;">${propertyName}</p></td></tr>
          <tr><td style="padding-top:12px;"><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Landlord</p><p style="margin:0;font-size:14px;font-weight:600;color:#111;">${landlordName}</p></td></tr>
          <tr><td style="padding-top:8px;"><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Tenant</p><p style="margin:0;font-size:14px;font-weight:600;color:#111;">${tenantName}</p></td></tr>
          <tr><td style="padding-top:8px;"><p style="margin:0 0 4px;font-size:12px;color:#6B7280;">Signed On</p><p style="margin:0;font-size:14px;font-weight:600;color:#111;">${signedAt}</p></td></tr>
        </table>
        ${auditSummaryHtml}
        <p style="margin:16px 0 8px;font-size:13px;color:#6B7280;">A legally binding copy of this signed lease is available for download. Keep this for your records.</p>
        ${pdfUrl ? ctaButton('Download Signed Lease PDF', pdfUrl) : ''}
        <p style="margin:16px 0 0;font-size:12px;color:#9CA3AF;">This lease was digitally signed via RentFlow. Electronic signatures are legally binding under the IT Act 2000 (India) and ESIGN Act 2000 (USA).</p>
    `)

  await Promise.all([
    resend.emails.send({ from: FROM, to: landlordEmail, subject: `Lease Fully Signed — ${propertyName}`, html: makeHtml(landlordName) }),
    resend.emails.send({ from: FROM, to: tenantEmail, subject: `Lease Fully Signed — ${propertyName}`, html: makeHtml(tenantName) }),
  ])
}
