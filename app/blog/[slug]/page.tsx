'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { blogPosts, categoryColors } from '@/lib/blog-posts'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { use } from 'react'

// ── Grain + grid background shared with blog index ──
function PageBackground() {
    return (
        <>
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
            <div
                aria-hidden
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '60vh',
                    background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(232,57,42,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    zIndex: 1,
                }}
            />
        </>
    )
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)
    const post = blogPosts.find((p) => p.slug === slug)
    if (!post) notFound()

    const color = categoryColors[post.category] ?? '#E8392A'
    const otherPosts = blogPosts.filter((p) => p.slug !== slug).slice(0, 3)

    return (
        <div
            className="relative min-h-screen"
            style={{
                background: '#080808',
                backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
            }}
        >
            <PageBackground />

            <div className="relative z-10 max-w-2xl mx-auto px-6 py-24">

                {/* ── Back link ── */}
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-10"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Blog
                </Link>

                {/* ── Category ── */}
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color }}>
                    {post.category}
                </p>

                {/* ── Title ── */}
                <h1
                    className="text-white font-bold leading-tight mb-4"
                    style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', letterSpacing: '-0.025em', lineHeight: 1.15 }}
                >
                    {post.title}
                </h1>

                {/* ── Meta ── */}
                <p className="text-sm text-gray-500 mb-8">
                    {post.readTime} · {post.date}
                </p>

                {/* ── Divider ── */}
                <div className="mb-10" style={{ height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }} />

                {/* ── Body ── */}
                <div className="space-y-5">
                    {post.body?.map((section, i) => {
                        if (section.type === 'heading') {
                            return (
                                <h2 key={i} className="text-white text-xl font-semibold mt-8 mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                                    {section.text}
                                </h2>
                            )
                        }
                        if (section.type === 'paragraph') {
                            return (
                                <p key={i} className="text-gray-300 text-base leading-7" style={{ fontFamily: 'var(--font-sans)' }}>
                                    {section.text}
                                </p>
                            )
                        }
                        if (section.type === 'tip') {
                            return (
                                <div
                                    key={i}
                                    className="rounded-r-xl p-4 my-6 text-sm text-gray-300 leading-relaxed"
                                    style={{
                                        background: 'rgba(232,57,42,0.06)',
                                        borderLeft: '3px solid #E8392A',
                                    }}
                                >
                                    {section.text}
                                </div>
                            )
                        }
                        if (section.type === 'step') {
                            return (
                                <div key={i} className="flex items-start gap-3 mt-8">
                                    <span
                                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                                        style={{ background: '#E8392A' }}
                                    >
                                        {section.step}
                                    </span>
                                    <h3 className="text-white text-lg font-semibold pt-0.5" style={{ fontFamily: 'var(--font-serif)' }}>
                                        {section.text}
                                    </h3>
                                </div>
                            )
                        }
                        return null
                    })}
                </div>

                {/* ── Bottom CTA ── */}
                <div
                    className="mt-16 rounded-2xl p-8 text-center"
                    style={{
                        background: 'rgba(232,57,42,0.05)',
                        border: '1px solid rgba(232,57,42,0.14)',
                    }}
                >
                    <p className="text-white text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                        Ready to try it yourself?
                    </p>
                    <p className="text-gray-400 text-sm mb-6">Start managing your properties smarter — it only takes 10 minutes to set up.</p>
                    <Link
                        href="/signup"
                        className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                        style={{ background: '#E8392A' }}
                    >
                        Start for free <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* ── More posts ── */}
                {otherPosts.length > 0 && (
                    <div className="mt-16">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-6">More from the blog</p>
                        <div className="space-y-4">
                            {otherPosts.map((p) => {
                                const c = categoryColors[p.category] ?? '#E8392A'
                                return (
                                    <Link key={p.slug} href={`/blog/${p.slug}`} className="group flex items-center justify-between gap-4 rounded-xl p-4 transition-all hover:bg-white/[0.03]" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: c }}>{p.category}</p>
                                            <p className="text-white text-sm font-medium leading-snug">{p.title}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 flex-shrink-0 text-gray-600 group-hover:text-gray-300 transition-colors" />
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
