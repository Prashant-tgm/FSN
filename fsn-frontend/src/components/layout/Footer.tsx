import { Link } from 'react-router-dom'
import logo from '../../fsn.png'

const col1 = [
  { label: 'Home', to: '/' },
  { label: 'Problems', to: '/problems' },
  { label: 'Wall of Fame', to: '/wall-of-fame' },
  { label: 'Blog', to: '/blog' },
]
const col2 = [
  { label: 'About FSN', to: '/about' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'Contact', to: '/contact' },
]
const col3 = [
  { label: 'Privacy Policy', to: '/legal/privacy-policy' },
  { label: 'Terms of Service', to: '/legal/terms-of-service' },
]

const IconX = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 4.076H5.078z" />
  </svg>
)

const IconLinkedIn = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const IconGitHub = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
)

const socialLinks = [
  { name: 'X', href: 'https://x.com', icon: IconX },
  { name: 'LinkedIn', href: 'https://linkedin.com', icon: IconLinkedIn },
  { name: 'GitHub', href: 'https://github.com', icon: IconGitHub },
]

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-white">
      {/* CTA strip */}
      <div className="border-b border-ink-700">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <p className="section-label text-ink-500 mb-3">Join the Movement</p>
            <h3 className="font-display text-3xl md:text-4xl font-semibold text-white leading-tight max-w-sm">
              Real problems need real solutions.{' '}
              <em className="not-italic text-fsn-400">Be part of FSN.</em>
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link to="/problems"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-white/20 text-sm text-white font-body font-medium hover:bg-white/10 transition-colors">
              Browse Problems
            </Link>
            <Link to="/problems?action=create"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white text-ink-900 text-sm font-body font-medium hover:bg-cream-100 transition-colors">
              Post a Problem
            </Link>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <img src={logo} alt="FSN Logo" className="w-10 h-10 object-contain brightness-0 invert opacity-80 hover:opacity-100 transition-opacity" />
              <div>
                <p className="font-display font-bold text-white text-xl leading-none tracking-tight">FSN</p>
                <p className="text-[10px] text-ink-500 font-body font-medium tracking-widest uppercase mt-0.5">Frugal Solutions Network</p>
              </div>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed max-w-xs mb-6">
              Connecting ground-level problems with innovators for lasting, community-verified impact.
            </p>
            <div className="flex gap-2">
              {socialLinks.map(({ name, href, icon: Icon }) => (
                <a key={name} href={href} target="_blank" rel="noreferrer" aria-label={name}
                  className="w-9 h-9 rounded-xl border border-ink-700 flex items-center justify-center text-ink-400 hover:border-white/30 hover:text-white transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Menu */}
          <div>
            <p className="section-label text-ink-600 mb-5">Menu</p>
            <ul className="space-y-3">
              {col1.map(l => <li key={l.to}><Link to={l.to} className="text-sm text-ink-400 hover:text-white transition-colors">{l.label}</Link></li>)}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="section-label text-ink-600 mb-5">Company</p>
            <ul className="space-y-3">
              {col2.map(l => <li key={l.to}><Link to={l.to} className="text-sm text-ink-400 hover:text-white transition-colors">{l.label}</Link></li>)}
            </ul>
          </div>

          {/* Legal + status */}
          <div>
            <p className="section-label text-ink-600 mb-5">Legal</p>
            <ul className="space-y-3 mb-8">
              {col3.map(l => <li key={l.to}><Link to={l.to} className="text-sm text-ink-400 hover:text-white transition-colors">{l.label}</Link></li>)}
            </ul>
            <div className="p-4 rounded-2xl border border-ink-700 bg-ink-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-fsn-400 animate-pulse" />
                <span className="text-xs text-ink-400">open for collaborations</span>
              </div>
              <p className="text-xs text-ink-600"></p>
            </div>
          </div>
        </div>

        <div className="border-t border-ink-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ink-600">©FSN {new Date().getFullYear()}. All rights reserved.</p>
          <p className="text-xs text-ink-700">Frugal Solutions Network — Impact through innovation</p>
        </div>
      </div>
    </footer>
  )
}
