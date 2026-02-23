/**
 * Extracts IP address and user agent from Next.js request headers.
 * Checks headers in priority order to handle reverse proxies, CDNs, and Cloudflare.
 */
export function getClientInfo(req: Request): { ipAddress: string; userAgent: string } {
    const headers = req.headers

    // Try headers in priority order
    // x-forwarded-for may contain multiple IPs (client, proxy1, proxy2...) — take first
    const xForwardedFor = headers.get('x-forwarded-for')
    const xRealIp = headers.get('x-real-ip')
    const cfConnectingIp = headers.get('cf-connecting-ip') // Cloudflare

    let ipAddress = '0.0.0.0'

    if (xForwardedFor) {
        ipAddress = xForwardedFor.split(',')[0].trim()
    } else if (cfConnectingIp) {
        ipAddress = cfConnectingIp.trim()
    } else if (xRealIp) {
        ipAddress = xRealIp.trim()
    }

    const userAgent = headers.get('user-agent') || 'Unknown'

    return { ipAddress, userAgent }
}
