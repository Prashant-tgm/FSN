import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon, Bars3Icon, XMarkIcon, BellIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { BellIcon as BellSolid } from '@heroicons/react/24/solid'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useNotifications } from '@/hooks/useProblems'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'
import logo from '../../fsn.png'

const links = [
  { to: '/problems',     label: 'Problems' },
  { to: '/wall-of-fame', label: 'Wall of Fame' },
  { to: '/blog',         label: 'Blog' },
]

export default function Navbar() {
  const { user, isAuthenticated, openAuthModal, logout } = useAuthStore()
  const { openSearch, toggleNotifs } = useUIStore()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
      scrolled ? 'bg-white/95 backdrop-blur-md border-b border-ink-100 shadow-sm' : 'bg-white border-b border-ink-100'
    )}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logo} alt="FSN Logo" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" />
            <div className="hidden sm:block leading-none">
              <p className="font-display font-bold text-ink-900 text-xl leading-none tracking-tight">FSN</p>
              <p className="text-[10px] text-ink-400 font-body font-medium tracking-widest uppercase mt-0.5">Frugal Solutions Network</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) => cn(
                  'px-4 py-2 text-sm font-body font-medium rounded-lg transition-colors',
                  isActive ? 'text-ink-900 bg-ink-50' : 'text-ink-400 hover:text-ink-900 hover:bg-ink-50'
                )}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button onClick={openSearch} className="p-2 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-ink-50 transition-colors">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>

            {isAuthenticated ? (
              <>
                <button onClick={toggleNotifs} className="relative p-2 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-ink-50 transition-colors">
                  {unreadCount > 0 ? <BellSolid className="w-5 h-5 text-fsn-700" /> : <BellIcon className="w-5 h-5" />}
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <div className="relative ml-1" ref={menuRef}>
                  <button onClick={() => setUserMenuOpen(o => !o)}
                    className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg hover:bg-ink-50 transition-colors">
                    <Avatar src={user?.avatarUrl} name={user?.fullName ?? 'U'} size="xs" />
                    <ChevronDownIcon className={cn('w-3.5 h-3.5 text-ink-300 transition-transform', userMenuOpen && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-modal border border-ink-100 py-2 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-ink-50">
                          <p className="text-sm font-semibold text-ink-900">{user?.fullName}</p>
                          <p className="text-xs text-ink-300 truncate">{user?.email}</p>
                        </div>
                        {[
                          ...(user?.id ? [{ label: 'My Profile',   path: `/users/${user.id}` }] : []),
                          { label: 'My Problems',  path: '/my/problems' },
                          { label: 'My Solutions', path: '/my/solutions' },
                          ...(['innovator','ngo','admin'].includes(user?.role ?? '') ? [{ label: '✍️ Write Blog', path: '/blog/new' }] : []),
                          ...(user?.role === 'admin' ? [{ label: '⚙️ Admin', path: '/admin' }] : []),
                        ].map(item => (
                          <button key={item.path} onClick={() => { navigate(item.path); setUserMenuOpen(false) }}
                            className="w-full text-left px-4 py-2.5 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-900 transition-colors">
                            {item.label}
                          </button>
                        ))}
                        <div className="border-t border-ink-50 mt-1 pt-1">
                          <button onClick={() => { logout(); setUserMenuOpen(false) }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <button onClick={() => openAuthModal('login')}
                  className="text-sm font-medium text-ink-500 hover:text-ink-900 px-3 py-2 rounded-lg hover:bg-ink-50 transition-colors">
                  Sign In
                </button>
                <button onClick={() => openAuthModal('register')} className="btn-dark btn-sm">
                  Join FSN
                </button>
              </div>
            )}

            <button onClick={() => setMobileOpen(o => !o)} className="md:hidden p-2 rounded-lg text-ink-400 hover:bg-ink-50 ml-1 transition-colors">
              {mobileOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-ink-100 bg-white overflow-hidden">
            <nav className="px-5 py-4 space-y-1">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => cn(
                    'block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive ? 'text-ink-900 bg-ink-50' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'
                  )}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
