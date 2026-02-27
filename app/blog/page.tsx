'use client'

import Link from 'next/link'
import { useState } from 'react'
import { blogPosts, categoryColors, categoryGradients } from '@/lib/blog-posts'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowRight } from 'lucide-react'

const featured = blogPosts.find((p) => p.featured)!
const grid = blogPosts.filter((p) => !p.featured)

export default function BlogPage() {
    const [email, setEmail] = useState('')

    function handleSubscribe(e: React.FormEvent) {
        e.preventDefault()
        toast.success("Thanks! We'll be in touch.")
        setEmail('')
    }

    return (
        <>
            <Toaster position="top-center" />

            {/* ── Page wrapper: base dark bg + grid lines ── */}
            <div
                className="relative min-h-screen"
                style={{
                    background: '#080808',
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            >
                {/* Grain overlay */}
                <div
                    aria-hidden
                    style={{
                        position: 'fixed',
                        inset: 0,
                        pointerEvents: 'none',
                        zIndex: 5,
                        opacity: 0.04,
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                        backgroundRepeat: 'repeat',
                        backgroundSize: '256px 256px',
                    }}
                />

                {/* Red top-center glow */}
                <div
                    aria-hidden
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '60vh',
                        background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(232,57,42,0.09) 0%, transparent 70%)',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                />

                {/* Content layer */}
                <div className="relative z-10 max-w-5xl mx-auto px-6">

                    {/* ── Navbar spacer ── */}
                    <div className="h-24" />

                    {/* ── Hero ── */}
                    <section className="pt-12 pb-16 text-center">
                        <span
                            className="inline-block mb-6 rounded-full px-4 py-1 text-sm font-semibold"
                            style={{
                                border: '1px solid rgba(232,57,42,0.35)',
                                background: 'rgba(232,57,42,0.08)',
                                color: '#E8392A',
                            }}
                        >
                            RentFlow Blog
                        </span>
                        <h1
                            className="font-bold text-white tracking-tight leading-none"
                            style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
                        >
                            Learn how to manage your<br className="hidden sm:block" /> properties like a pro
                        </h1>
                        <p className="text-gray-400 text-lg mt-5 max-w-xl mx-auto" style={{ lineHeight: 1.6 }}>
                            Guides, tips, and walkthroughs to help landlords save time and stay organised.
                        </p>
                    </section>

                    {/* ── Featured post ── */}
                    <Link href={`/blog/${featured.slug}`} className="block mb-10 group">
                        <article
                            className="rounded-2xl p-8 transition-all duration-300 flex flex-col md:flex-row gap-8"
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.07)',
                            }}
                            onMouseEnter={(e) => {
                                const el = e.currentTarget as HTMLElement
                                el.style.borderColor = 'rgba(232,57,42,0.28)'
                                el.style.boxShadow = '0 0 48px rgba(232,57,42,0.07)'
                            }}
                            onMouseLeave={(e) => {
                                const el = e.currentTarget as HTMLElement
                                el.style.borderColor = 'rgba(255,255,255,0.07)'
                                el.style.boxShadow = 'none'
                            }}
                        >
                            {/* Text side */}
                            <div className="flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: categoryColors[featured.category] }}>
                                        {featured.category}
                                    </p>
                                    <h2 className="text-white font-bold text-xl leading-snug mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
                                        {featured.title}
                                    </h2>
                                    <p className="text-gray-400 text-sm leading-relaxed">{featured.description}</p>
                                </div>
                                <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <span className="text-xs text-gray-500">{featured.readTime} · {featured.date}</span>
                                    <span className="text-sm font-semibold flex items-center gap-1.5 transition-all group-hover:gap-2.5" style={{ color: '#E8392A' }}>
                                        Read Guide <ArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </div>

                            {/* Decorative gradient side */}
                            <div
                                className="rounded-xl flex-shrink-0 w-full md:w-[38%] hidden sm:block"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(232,57,42,0.18), rgba(232,57,42,0.03))',
                                    border: '1px solid rgba(232,57,42,0.12)',
                                    aspectRatio: '16/10',
                                    minHeight: 180,
                                }}
                            />
                        </article>
                    </Link>

                    {/* ── Blog grid ── */}
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {grid.map((post) => {
                            const color = categoryColors[post.category] ?? '#E8392A'
                            const gradient = categoryGradients[post.category] ?? categoryGradients['Getting Started']
                            return (
                                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                                    <article
                                        className="rounded-2xl p-6 h-full flex flex-col cursor-pointer transition-all duration-[250ms]"
                                        style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                        }}
                                        onMouseEnter={(e) => {
                                            const el = e.currentTarget as HTMLElement
                                            el.style.transform = 'translateY(-4px)'
                                            el.style.borderColor = 'rgba(255,255,255,0.13)'
                                            el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.35)'
                                        }}
                                        onMouseLeave={(e) => {
                                            const el = e.currentTarget as HTMLElement
                                            el.style.transform = 'translateY(0)'
                                            el.style.borderColor = 'rgba(255,255,255,0.06)'
                                            el.style.boxShadow = 'none'
                                        }}
                                    >
                                        {/* Cover gradient */}
                                        <div
                                            className="rounded-xl mb-5 w-full"
                                            style={{ background: gradient, height: 160, border: `1px solid ${color}22` }}
                                        />
                                        {/* Category */}
                                        <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color }}>
                                            {post.category}
                                        </p>
                                        {/* Title */}
                                        <h3 className="text-white font-semibold text-base leading-snug mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                                            {post.title}
                                        </h3>
                                        {/* Description */}
                                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 flex-1">{post.description}</p>
                                        {/* Bottom row */}
                                        <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span className="text-xs text-gray-500">{post.readTime}</span>
                                            <span className="text-xs font-semibold flex items-center gap-1 transition-all group-hover:gap-2" style={{ color }}>
                                                Read <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </article>
                                </Link>
                            )
                        })}
                    </section>

                    {/* ── Newsletter CTA ── */}
                    <section
                        className="rounded-2xl p-10 text-center mb-24"
                        style={{
                            background: 'rgba(232,57,42,0.05)',
                            border: '1px solid rgba(232,57,42,0.14)',
                        }}
                    >
                        <h2 className="text-white text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                            Get landlord tips straight to your inbox
                        </h2>
                        <p className="text-gray-400 text-sm mb-8">No spam. Just useful guides when we publish them.</p>
                        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <input
                                type="email"
                                required
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="rounded-full px-5 py-3 text-sm text-white outline-none"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    width: '18rem',
                                    maxWidth: '100%',
                                }}
                            />
                            <button
                                type="submit"
                                className="rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                                style={{ background: '#E8392A' }}
                            >
                                Subscribe
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </>
    )
}
