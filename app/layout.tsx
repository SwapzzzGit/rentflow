import type { Metadata, Viewport } from 'next'
import { DM_Sans, Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'react-hot-toast'
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
      <head>
        {/* Anti-flash: apply theme class before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'system';var r=document.documentElement;if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}r.classList.add(t);if(t==='dark'){r.classList.remove('light')}else{r.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-white dark:bg-[#080808] text-gray-900 dark:text-[#ffffff] overflow-x-hidden" suppressHydrationWarning>
        {children}
        <Analytics />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#E8392A', secondary: '#fff' } },
          }}
        />

      </body>
    </html>
  )
}
