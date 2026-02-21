import type { Metadata, Viewport } from 'next'
import { DM_Sans, Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
})

export const metadata: Metadata = {
  title: 'RentFlow - Your Shortcut to Effortless Landlording',
  description: 'One app replaces five tools. Rent tracking, expenses, maintenance, and tenant communication for landlords in the US, UK, and Australia.',
}

export const viewport: Viewport = {
  themeColor: '#080808',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${bricolage.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-[#080808] text-[#ffffff] overflow-x-hidden" suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
