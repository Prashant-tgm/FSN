import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/lib/api'
import { Modal, Input, Button } from '@/components/ui'
import { cn, getError } from '@/lib/utils'
import toast from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'

const roles = [
  { value: 'bop_user', label: 'Community Member', desc: 'Share problems from your community', icon: '🏘️' },
  { value: 'ngo',      label: 'NGO / Organization', desc: 'Facilitate co-creation and validate solutions', icon: '🤝' },
  { value: 'innovator', label: 'Innovator', desc: 'Design and submit frugal solutions', icon: '💡' },
] as const

type RegStep = 'form' | 'otp'

export default function AuthModal() {
  const { isAuthModalOpen, authModalTab, closeAuthModal, openAuthModal } = useAuthStore()
  const { login, register, verifyEmail, googleLogin, loginPending, registerPending, verifyPending, googlePending } = useAuth()

  // ─── Shared state ───────────────────────────────────────────────────
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [showConsentError, setShowConsentError] = useState(false)

  // ─── Login state ────────────────────────────────────────────────────
  const [loginF, setLoginF] = useState({ email: '', password: '' })
  const setL = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setLoginF(f => ({ ...f, [k]: e.target.value }))

  // ─── Register state ─────────────────────────────────────────────────
  const [regStep, setRegStep] = useState<RegStep>('form')
  const [regF, setRegF] = useState({
    fullName: '', email: '', password: '', role: 'innovator' as string, phone: '',
  })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpSending, setOtpSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const setR = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRegF(f => ({ ...f, [k]: e.target.value }))

  // Reset on tab change or modal close
  useEffect(() => {
    if (!isAuthModalOpen || authModalTab === 'login') {
      setRegStep('form')
      setOtp(['', '', '', '', '', ''])
      setCountdown(0)
    }
    if (!isAuthModalOpen) {
      setLoginF({ email: '', password: '' })
      setRegF({ fullName: '', email: '', password: '', role: 'innovator', phone: '' })
      setConsentAccepted(false)
      setShowConsentError(false)
    }
  }, [isAuthModalOpen, authModalTab])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // ─── Send OTP ────────────────────────────────────────────────────────
  const handleRegisterSubmit = async () => {
    if (!consentAccepted) {
      setShowConsentError(true)
      return toast.error('You must agree to the Terms & Conditions')
    }
    
    if (!regF.fullName.trim()) return toast.error('Please enter your full name')
    if (!regF.email.trim()) return toast.error('Please enter your email')
    if (regF.password.length < 8) return toast.error('Password must be at least 8 characters')

    setOtpSending(true)
    try {
      register(regF, {
        onSuccess: () => {
          setRegStep('otp')
          setCountdown(300)
          setTimeout(() => inputRefs.current[0]?.focus(), 100)
        }
      })
    } catch (err) {
      toast.error(getError(err))
    } finally {
      setOtpSending(false)
    }
  }

  // ─── OTP input handler ──────────────────────────────────────────────
  const handleOtpChange = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[idx] = value.slice(-1)
    setOtp(next)
    if (value && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...otp]
    text.split('').forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    inputRefs.current[Math.min(text.length, 5)]?.focus()
  }

  const handleVerifyEmail = async () => {
    const code = otp.join('')
    if (code.length !== 6) return toast.error('Enter the 6-digit code')
    verifyEmail({ email: regF.email, otp: code })
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <Modal open={isAuthModalOpen} onClose={closeAuthModal} size="sm">
      {/* Tabs */}
      <div className="flex border-b border-ink-100">
        {(['login', 'register'] as const).map(tab => (
          <button key={tab} onClick={() => openAuthModal(tab)}
            className={cn(
              'flex-1 py-4 text-sm font-body font-semibold uppercase tracking-widest transition-colors',
              authModalTab === tab ? 'text-ink-900 border-b-2 border-ink-900 -mb-px' : 'text-ink-300 hover:text-ink-600'
            )}>
            {tab === 'login' ? 'Sign In' : 'Join FSN'}
          </button>
        ))}
      </div>

      <div className="p-7">
        {authModalTab === 'login' ? (
          /* ═══════════════════════ LOGIN ═══════════════════════ */
          <form onSubmit={e => { e.preventDefault(); login(loginF) }} className="space-y-5">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold text-ink-900">Welcome back</h2>
              <p className="text-sm text-ink-400 mt-1">Sign in to your FSN account</p>
            </div>

            <Input label="Email" type="email" placeholder="you@example.com"
              value={loginF.email} onChange={setL('email')} required />
            <Input label="Password" type="password" placeholder="••••••••"
              value={loginF.password} onChange={setL('password')} required />

            <div className="flex items-start gap-2 py-1">
              <input type="checkbox" id="consent-login" 
                checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)}
                className={cn("mt-1 rounded border-ink-200 text-ink-900 focus:ring-ink-900", showConsentError && !consentAccepted && "border-red-500")} />
              <label htmlFor="consent-login" className="text-xs text-ink-400 leading-normal cursor-pointer">
                I agree to the <a href="/terms" className="underline">Terms of Service</a> and <a href="/privacy" className="underline">Privacy Policy</a>
              </label>
            </div>

            <Button type="submit" fullWidth loading={loginPending} className="mt-2 rounded-full" variant="dark">
              Sign In
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-ink-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-ink-300">Or continue with</span></div>
            </div>

            <div className="flex flex-col gap-3">
              {!consentAccepted ? (
                <button type="button" onClick={() => setShowConsentError(true)}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-full border border-ink-100 text-sm font-body font-medium text-ink-300 bg-ink-50/50 cursor-not-allowed">
                  <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/></svg>
                  Google (Accept Terms First)
                </button>
              ) : (
                <div className="w-full flex justify-center">
                  <GoogleLogin 
                    onSuccess={res => res.credential && googleLogin(res.credential)}
                    onError={() => toast.error('Google Sign-In failed')}
                    useOneTap
                    shape="pill"
                    theme="outline"
                    width="100%"
                  />
                </div>
              )}
            </div>
          </form>
        ) : regStep === 'form' ? (
          /* ═══════════════════════ REGISTER — STEP 1 ═══════════════════════ */
          <div className="space-y-5">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold text-ink-900">Join the network</h2>
              <p className="text-sm text-ink-400 mt-1">Create your FSN account — email verification required</p>
            </div>

            <Input label="Full Name" placeholder="Your full name"
              value={regF.fullName} onChange={setR('fullName')} required />
            <Input label="Phone Number" type="tel" placeholder="+919876543210"
              value={regF.phone} onChange={setR('phone')} required />
            <Input label="Email" type="email" placeholder="you@example.com"
              value={regF.email} onChange={setR('email')} required />
            <Input label="Password" type="password" placeholder="Min. 8 chars (Aa1…)"
              value={regF.password} onChange={setR('password')} required />

            {/* Role picker */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-ink-500 uppercase tracking-widest">I am a…</p>
              {roles.map(r => (
                <button key={r.value} type="button" onClick={() => setRegF(f => ({ ...f, role: r.value }))}
                  className={cn(
                    'w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all',
                    regF.role === r.value ? 'border-ink-900 bg-ink-50 shadow-sm' : 'border-ink-100 hover:border-ink-300'
                  )}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{r.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{r.label}</p>
                    <p className="text-xs text-ink-400">{r.desc}</p>
                  </div>
                  <div className={cn(
                    'ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 transition-colors',
                    regF.role === r.value ? 'border-ink-900 bg-ink-900' : 'border-ink-300'
                  )} />
                </button>
              ))}
            </div>

            <div className="flex items-start gap-2 py-1">
              <input type="checkbox" id="consent-reg" 
                checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)}
                className={cn("mt-1 rounded border-ink-200 text-ink-900 focus:ring-ink-900", showConsentError && !consentAccepted && "border-red-500")} />
              <label htmlFor="consent-reg" className="text-xs text-ink-400 leading-normal cursor-pointer">
                I agree to the <a href="/terms" className="underline">Terms of Service</a> and <a href="/privacy" className="underline">Privacy Policy</a>
              </label>
            </div>

            <Button fullWidth loading={registerPending || otpSending} variant="dark" className="rounded-full"
              onClick={handleRegisterSubmit}>
              Create Account & Send OTP
            </Button>
          </div>
        ) : (
          /* ═══════════════════════ REGISTER — STEP 2: OTP ═══════════════════════ */
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-fsn-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📧</span>
              </div>
              <h2 className="font-display text-2xl font-semibold text-ink-900">Verify your email</h2>
              <p className="text-sm text-ink-400 mt-1">
                Enter the 6-digit code sent to <span className="font-semibold text-ink-700">{regF.email}</span>
              </p>
            </div>

            {/* OTP input boxes */}
            <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className={cn(
                    'w-12 h-14 text-center text-xl font-display font-semibold rounded-xl border-2 transition-all',
                    'focus:outline-none focus:border-fsn-700 focus:ring-2 focus:ring-fsn-700/20',
                    digit ? 'border-ink-900 bg-ink-50' : 'border-ink-200 bg-white'
                  )}
                />
              ))}
            </div>

            {/* Timer & Resend */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-ink-400">
                  Code expires in <span className="font-semibold text-ink-700 font-mono">{fmtTime(countdown)}</span>
                </p>
              ) : (
                <button onClick={handleRegisterSubmit} disabled={otpSending}
                  className="text-sm font-medium text-fsn-700 hover:text-fsn-900 transition-colors">
                  Resend OTP
                </button>
              )}
            </div>

            <div className="space-y-3">
              <Button fullWidth loading={verifyPending} variant="dark" className="rounded-full"
                onClick={handleVerifyEmail}>
                Verify & Sign In
              </Button>
              <button onClick={() => { setRegStep('form'); setOtp(['','','','','','']) }}
                className="w-full text-sm text-ink-400 hover:text-ink-700 transition-colors py-2">
                ← Back to form
              </button>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
              <p className="text-xs text-amber-700">
                <strong>Dev Mode:</strong> Check the backend terminal for the OTP code. It will be logged as: <code className="bg-amber-100 px-1 rounded">[MOCK MAIL] Sending OTP ... to {regF.email}</code>
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-center text-ink-300 mt-5">
          By continuing you agree to FSN's{' '}
          <a href="/legal/terms-of-service" className="underline hover:text-ink-900 transition-colors">Terms</a> &{' '}
          <a href="/legal/privacy-policy" className="underline hover:text-ink-900 transition-colors">Privacy Policy</a>.
        </p>
      </div>
    </Modal>
  )
}
