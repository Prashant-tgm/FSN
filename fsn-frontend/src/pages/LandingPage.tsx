import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { motion, useInView } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useProblems } from '@/hooks/useProblems'
import { wallOfFameApi, blogApi, statsApi } from '@/lib/api'
import type { PlatformStats } from '@/lib/api'
import ProblemCard from '@/components/domain/ProblemCard'
import { BlogCard } from '@/components/domain/Cards'
import { CardSkeleton, Avatar, ImpactScore } from '@/components/ui'
import { Problem, Blog, WallOfFameEntry, PaginatedResult } from '@/lib/types'
import { tierConfig } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 22 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
      {children}
    </motion.div>
  )
}

// ─── Marquee ticker (Estatia-style) ───────────────────────────────────────────
const marqueeItems = [
  'WATER & SANITATION', 'HEALTHCARE ACCESS', 'COMMUNITY AGRICULTURE',
  'RURAL EDUCATION', 'CLEAN ENERGY', 'GENDER EQUALITY', 'INFRASTRUCTURE',
  'FINANCIAL INCLUSION', 'CLIMATE RESILIENCE', 'INNOVATION FOR IMPACT',
]

function MarqueeTicker({ dark = false }: { dark?: boolean }) {
  const items = [...marqueeItems, ...marqueeItems]
  const base = dark
    ? 'bg-ink-900/50 backdrop-blur-sm text-white/40 border-t border-b border-white/5'
    : 'bg-cream-100 text-ink-300 border-t border-b border-ink-50'

  return (
    <div className={`overflow-hidden py-4 ${base}`}>
      <div className="flex whitespace-nowrap">
        <ul className="marquee-track marquee-primary flex items-center gap-0">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-6 px-10 text-[10px] font-body font-bold tracking-[0.2em] uppercase">
              {item}
              <span className="text-current opacity-20">◆</span>
            </li>
          ))}
        </ul>
        <ul className="marquee-track marquee-secondary flex items-center gap-0" aria-hidden>
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-6 px-10 text-[10px] font-body font-bold tracking-[0.2em] uppercase">
              {item}
              <span className="text-current opacity-20">◆</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Stats helpers ────────────────────────────────────────────────────────────
function formatCount(n: number): string {
  if (n >= 1000) {
    const k = Math.floor(n / 100) / 10
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k+`
  }
  return n > 0 ? `${n.toLocaleString()}+` : '0'
}

function buildStats(data?: PlatformStats) {
  return [
    { value: data ? formatCount(data.problemsCount) : '—', label: 'Problems Documented', sub: data ? `Across ${data.communitiesCount || 0} communities` : 'Loading…' },
    { value: data ? formatCount(data.solutionsCount) : '—', label: 'Solutions Submitted', sub: 'By innovators worldwide' },
    { value: data ? formatCount(data.innovatorsCount) : '—', label: 'Active Innovators', sub: 'Building real solutions' },
    { value: data ? `${data.satisfactionRate}%` : '—%', label: 'Satisfaction Rate', sub: 'Community-verified impact' },
  ]
}

// ─── How it works steps ───────────────────────────────────────────────────────
const steps = [
  {
    num: '01', title: 'Document a Problem',
    desc: 'Community members share real on-the-ground challenges with location, media, and urgency levels.',
    icon: '📍',
  },
  {
    num: '02', title: 'NGO Validates',
    desc: 'Partner NGOs verify submissions, add context, and open co-creation workspaces.',
    icon: '🤝',
  },
  {
    num: '03', title: 'Innovators Build',
    desc: 'Entrepreneurs and technologists submit structured solution blueprints with timelines and budgets.',
    icon: '💡',
  },
  {
    num: '04', title: 'Community Rates',
    desc: 'BOP members give checkpoint-based feedback that powers transparent Impact Scores.',
    icon: '⭐',
  },
]

// ─── Benefits ─────────────────────────────────────────────────────────────────
const benefits = [
  { title: 'Transparent Impact',   desc: 'Every solution is scored using our open Impact Score algorithm — no black boxes, only accountability.' },
  { title: 'Co-Creation First',    desc: 'NGOs facilitate, innovators build, communities guide. Collaboration is built into every workflow.' },
  { title: 'Real Communities',     desc: 'Problems come directly from BOP community members — verified and geolocated, not hypothetical.' },
  { title: 'Open Feedback Loops',  desc: 'Checkpoint-based community feedback keeps solutions honest and continuously improving.' },
  { title: 'Skill Meets Purpose',  desc: 'Innovators gain impact credentials, recognition, and a chance to feature in the Wall of Fame.' },
  { title: 'Structured Process',   desc: 'From problem to solution to feedback — a repeatable pipeline designed for maximum impact.' },
]

import heroImage from '@/hero-innovation.png'

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { openAuthModal, isAuthenticated } = useAuthStore()
  const { data: problemsData, isLoading: problemsLoading } = useProblems({ limit: 6, sort: 'upvoteCount', order: 'desc' })
  const { data: blogsData, isLoading: blogsLoading } = useQuery<PaginatedResult<Blog>>({
    queryKey: ['blog', 'featured'],
    queryFn: async () => {
      const res = await blogApi.getAll({ limit: 3 })
      return res.data.data
    }
  })
  const { data: wofData } = useQuery<PaginatedResult<WallOfFameEntry>>({
    queryKey: ['wof', 'teaser'],
    queryFn: async () => {
      const res = await wallOfFameApi.getAll({ limit: 3 })
      return res.data.data
    }
  })
  const { data: platformStats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => statsApi.getPlatformStats().then(r => r.data.data),
    staleTime: 60_000, // cache for 1 minute
  })
  const stats = buildStats(platformStats)

  return (
    <div className="min-h-screen">

      {/* ── Hero (Premium Split Layout with Mesh Gradient) ──────────────── */}
      <section className="relative mesh-gradient pt-32 pb-24 overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated background noise */}
        <div className="absolute inset-0 noise-overlay opacity-[0.03] pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Typography */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-left"
            >
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8">
                <span className="w-2 h-2 rounded-full bg-fsn-400 animate-pulse" />
                <span className="text-xs font-body font-medium text-white/70 tracking-widest uppercase">
                  Innovation for the Bottom of the Pyramid
                </span>
              </div>

              <h1 className="font-display font-semibold text-white leading-[1.1] mb-8"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4.8rem)' }}>
                Solve Real Problems.<br />
                <span className="text-fsn-400 italic">Create Lasting</span><br />
                Impact.
              </h1>

              <p className="text-lg text-white/60 max-w-xl mb-12 font-body leading-relaxed">
                FSN bridges the gap between ground-level challenges and world-class innovation. 
                We connect BOP communities with NGOs and innovators to build, test, and scale 
                frugal solutions that actually work.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <>
                    <Link to="/problems"
                      className="btn-dark bg-white text-ink-900 px-10 py-4 hover:bg-fsn-50 transition-all shadow-xl shadow-white/5">
                      Browse Problems <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                    <Link to="/problems?action=create"
                      className="btn-outline border-white/20 text-white px-10 py-4 hover:bg-white/10 transition-all">
                      Post a Problem
                    </Link>
                  </>
                ) : (
                  <>
                    <button onClick={() => openAuthModal('register')}
                      className="btn-dark bg-white text-ink-900 px-10 py-4 hover:bg-fsn-50 transition-all shadow-xl shadow-white/5">
                      Join the Network <ArrowRightIcon className="w-4 h-4" />
                    </button>
                    <Link to="/problems"
                      className="btn-outline border-white/20 text-white px-10 py-4 hover:bg-white/10 transition-all">
                      Explore Challenges
                    </Link>
                  </>
                )}
              </div>

              {/* Minimal stats row */}
              <div className="mt-16 flex items-center gap-10">
                {stats.slice(0, 2).map((s, i) => (
                  <div key={i} className="border-l border-white/10 pl-6">
                    <p className="font-display text-3xl font-semibold text-white leading-none mb-1">{s.value}</p>
                    <p className="text-xs font-body font-medium text-white/50 tracking-wider uppercase">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Column: Visual Component */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Main Image Frame */}
              <div className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl rotate-1 group transition-transform hover:rotate-0 duration-700">
                <img 
                  src={heroImage} 
                  alt="Frugal Innovation in Action" 
                  className="w-full aspect-[4/5] object-cover scale-105 group-hover:scale-100 transition-transform duration-1000" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
                
                {/* Floating Impact Card inside image */}
                <div className="absolute bottom-6 left-6 right-6 glass-card p-5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-fsn-500 flex items-center justify-center">
                      <span className="text-white text-xl">💡</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Community Verified</p>
                      <p className="text-white/60 text-xs">Solutions tested by real people</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-fsn-500/20 blur-[80px] rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gold-500/10 blur-[80px] rounded-full" />
              
              {/* Secondary floating card */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-12 top-1/4 glass-card p-4 hidden xl:block shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center">
                    <span className="text-gold-500">🏆</span>
                  </div>
                  <p className="text-white text-xs font-medium">Wall of Fame <br/><span className="text-white/50">Top Innovators</span></p>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Marquee ticker ────────────────────────────────────────────────── */}
      <MarqueeTicker dark />

      {/* ── About / intro ─────────────────────────────────────────────────── */}
      <section id="about" className="max-w-7xl mx-auto px-5 sm:px-8 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <p className="section-label text-fsn-700 mb-4">About FSN</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 leading-tight mb-6">
              Experts in connecting<br />
              <em className="not-italic text-fsn-600">problems with solutions</em>
            </h2>
            <p className="text-ink-400 leading-relaxed mb-6">
              At FSN we believe every community challenge has a solution — it just needs the right bridge. We bring skill,
              rigour, and transparency to every connection: from the moment a problem is documented to the day a solution
              is implemented and verified by the people it serves.
            </p>
            <p className="text-ink-400 leading-relaxed mb-8">
              Whether it's a small village water crisis or a region-wide agricultural challenge, every improvement counts.
            </p>
            <div className="flex gap-4">
              <Link to="/problems" className="btn-dark px-6 py-2.5 text-sm rounded-full inline-flex items-center gap-2 font-body font-medium">
                Browse Problems <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link to="/wall-of-fame" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-ink-200 text-ink-700 text-sm font-body font-medium hover:border-ink-900 hover:text-ink-900 transition-colors">
                Wall of Fame
              </Link>
            </div>
          </Reveal>

          {/* Stat grid */}
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s, i) => (
                <div key={i} className="rounded-2xl border border-ink-100 bg-cream-50 p-6">
                  <p className="font-display text-4xl font-semibold text-ink-900 mb-1">{s.value}</p>
                  <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-xs text-ink-300">{s.sub}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Marquee light ─────────────────────────────────────────────────── */}
      <MarqueeTicker />

      {/* ── Featured Problems ─────────────────────────────────────────────── */}
      <section className="bg-cream-100 py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal className="flex items-end justify-between flex-wrap gap-4 mb-12">
            <div>
              <p className="section-label text-fsn-700 mb-3">Community Feed</p>
              <h2 className="font-display text-4xl md:text-5xl font-semibold text-ink-900">Our work speaks<br />for itself</h2>
            </div>
            <Link to="/problems" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-ink-200 text-sm font-body font-medium text-ink-700 hover:border-ink-900 hover:text-ink-900 transition-colors">
              View More Problems <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {problemsLoading
              ? Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)
              : problemsData?.data?.map((p: Problem, i: number) => <ProblemCard key={p.id} problem={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── How It Works (Estatia numbered list style) ────────────────────── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-5 sm:px-8 py-24">
        <Reveal className="mb-14">
          <p className="section-label text-fsn-700 mb-3">The Process</p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 max-w-lg leading-tight">
            Experts in transforming ideas into impact
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Step list */}
          <div className="space-y-4">
            {steps.map((step, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="group flex gap-5 p-6 rounded-2xl border border-ink-100 bg-white hover:border-fsn-200 transition-all cursor-default">
                  <div className="flex-shrink-0">
                    <span className="font-display text-4xl font-semibold text-ink-100 group-hover:text-fsn-100 transition-colors leading-none">
                      {step.num}
                    </span>
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{step.icon}</span>
                      <h3 className="font-display text-lg font-semibold text-ink-900">{step.title}</h3>
                    </div>
                    <p className="text-sm text-ink-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Benefits panel */}
          <Reveal delay={0.15} className="bg-ink-900 rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <p className="section-label text-fsn-400 mb-4">Why FSN</p>
              <h3 className="font-display text-3xl font-semibold text-white mb-8 leading-snug">
                A platform built for real, lasting impact
              </h3>
              <div className="space-y-5">
                {benefits.slice(0, 4).map((b, i) => (
                  <div key={i} className="flex gap-4 pb-5 border-b border-ink-700 last:border-0 last:pb-0">
                    <div className="w-5 h-5 rounded-full bg-fsn-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">{b.title}</p>
                      <p className="text-xs text-ink-400 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Wall of Fame Teaser ───────────────────────────────────────────── */}
      {wofData?.data && wofData.data.length > 0 && (
        <section className="bg-cream-100 py-24">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <Reveal className="flex items-end justify-between flex-wrap gap-4 mb-12">
              <div>
                <p className="section-label text-gold-600 mb-3">Top Impact</p>
                <h2 className="font-display text-4xl md:text-5xl font-semibold text-ink-900">Wall of Fame</h2>
                <p className="text-ink-400 mt-2 text-sm max-w-md">The highest-impact solutions verified by communities, ranked by FSN's transparent Impact Score algorithm.</p>
              </div>
              <Link to="/wall-of-fame"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-ink-900 text-white text-sm font-body font-medium hover:bg-ink-700 transition-colors">
                See All Champions <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-5">
              {wofData.data.map((entry: WallOfFameEntry, i: number) => {
                const cfg = tierConfig[entry.tier]
                return (
                  <Reveal key={entry.id} delay={i * 0.07}>
                    <div className="rounded-2xl border-2 p-6 hover:-translate-y-1 transition-all duration-200"
                      style={{ background: cfg.bg, borderColor: cfg.border }}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={entry.innovator?.avatarUrl} name={entry.innovator?.fullName ?? '?'} size="md" />
                          <div>
                            <p className="font-semibold text-ink-900 text-sm">{entry.innovator?.fullName}</p>
                            <p className="text-xs text-ink-400">{entry.innovator?.organization ?? 'Innovator'}</p>
                          </div>
                        </div>
                        <span className="text-2xl">{cfg.icon}</span>
                      </div>
                      <p className="text-sm font-medium text-ink-700 mb-3">{entry.headline}</p>
                      <div className="flex items-center justify-between">
                        <ImpactScore score={entry.impactScore} size="sm" />
                        <span className="text-2xs text-ink-300">#{entry.rank}</span>
                      </div>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Blog ─────────────────────────────────────────────────────────────── */}
      {blogsData?.data && blogsData.data.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 sm:px-8 py-24">
          <Reveal className="flex items-end justify-between flex-wrap gap-4 mb-12">
            <div>
              <p className="section-label text-fsn-700 mb-3">Insights</p>
              <h2 className="font-display text-4xl md:text-5xl font-semibold text-ink-900">Stories from the field</h2>
            </div>
            <Link to="/blog"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-ink-200 text-sm font-body font-medium text-ink-700 hover:border-ink-900 hover:text-ink-900 transition-colors">
              Read All Articles <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {blogsLoading
              ? Array(3).fill(0).map((_, i) => <CardSkeleton key={i} />)
              : blogsData.data.map((b: Blog) => <BlogCard key={b.id} blog={b} />)}
          </div>
        </section>
      )}

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-24">
        <Reveal>
          <div className="bg-ink-900 rounded-3xl px-8 sm:px-14 py-16 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 110%, rgba(45,134,83,0.08) 0%, transparent 70%)' }} />
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="section-label text-fsn-400 mb-4">Get Started</p>
                <h2 className="font-display text-4xl md:text-5xl font-semibold text-white leading-tight mb-5">
                  Ready to make<br />
                  <em className="not-italic text-fsn-400">a real impact?</em>
                </h2>
                <p className="text-ink-400 text-sm leading-relaxed">
                  Whether you're facing challenges, have solutions to offer, or want to facilitate change — FSN is your platform.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3">
                <button onClick={() => openAuthModal('register')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-ink-900 text-sm font-body font-semibold hover:bg-cream-100 transition-colors">
                  Join FSN Free <ArrowRightIcon className="w-4 h-4" />
                </button>
                <Link to="/problems"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-white/20 text-white text-sm font-body font-semibold hover:bg-white/10 transition-colors">
                  Browse Problems
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
