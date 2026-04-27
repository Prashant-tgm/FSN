import { forwardRef, Fragment, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn, initials, urgencyConfig, problemStatusConfig, solutionStatusConfig, tierConfig } from '@/lib/utils'
import type { UrgencyLevel, ProblemStatus, SolutionStatus, WoFTier } from '@/lib/types'

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'dark' | 'outline' | 'green' | 'ghost' | 'danger' | 'outline-white'
type BtnSize    = 'sm' | 'md' | 'lg'

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant; size?: BtnSize; loading?: boolean; fullWidth?: boolean
}

const btnVariants: Record<BtnVariant, string> = {
  dark:          'bg-ink-900 text-white hover:bg-ink-700 shadow-sm',
  outline:       'border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white',
  green:         'bg-fsn-700 text-white hover:bg-fsn-800 shadow-sm',
  ghost:         'text-ink-500 hover:text-ink-900 hover:bg-ink-50',
  danger:        'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  'outline-white':'border border-white/30 text-white hover:bg-white/10',
}
const btnSizes: Record<BtnSize, string> = {
  sm: 'px-4 py-2 text-xs rounded-full gap-1.5',
  md: 'px-6 py-2.5 text-sm rounded-full gap-2',
  lg: 'px-8 py-3.5 text-base rounded-full gap-2',
}

export const Button = forwardRef<HTMLButtonElement, BtnProps>(
  ({ variant = 'dark', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-body font-medium',
        'transition-all duration-200 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fsn-700/30',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        btnVariants[variant], btnSizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading
        ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>{children}</span></>
        : children}
    </button>
  ),
)
Button.displayName = 'Button'

// ─── Badge / Pill ─────────────────────────────────────────────────────────────
interface BadgeProps {
  urgency?: UrgencyLevel; problemStatus?: ProblemStatus; solutionStatus?: SolutionStatus
  tier?: WoFTier; label?: string; className?: string
}
export function Badge({ urgency, problemStatus, solutionStatus, tier, label, className }: BadgeProps) {
  if (urgency) {
    const c = urgencyConfig[urgency]
    return <span className={cn(c.pillClass, className)}><span className={cn('w-1.5 h-1.5 rounded-full mr-1 inline-block', c.dot)} />{c.label}</span>
  }
  if (problemStatus) {
    const c = problemStatusConfig[problemStatus]
    return <span className={cn('pill text-2xs border', c.class, className)}>{c.label}</span>
  }
  if (solutionStatus) {
    const c = solutionStatusConfig[solutionStatus]
    return <span className={cn('pill text-2xs border', c.class, className)}>{c.label}</span>
  }
  if (tier) {
    const c = tierConfig[tier]
    return (
      <span className={cn('pill border', className)} style={{ background: c.bg, borderColor: c.border, color: c.text }}>
        {c.icon} {c.label}
      </span>
    )
  }
  return <span className={cn('pill-dark', className)}>{label}</span>
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const avatarSizes = { xs: 'w-7 h-7 text-xs', sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' }
type AvatarSize = keyof typeof avatarSizes

export function Avatar({ src, name, size = 'md', className }: { src?: string; name: string; size?: AvatarSize; className?: string }) {
  return (
    <div
      className={cn('rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 font-semibold font-body', avatarSizes[size], className)}
      style={{ background: src ? undefined : 'linear-gradient(135deg, #1A4731 0%, #2D8653 100%)', color: '#fff' }}
    >
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        : <span>{initials(name)}</span>}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export const Skeleton = ({ className }: { className?: string }) =>
  <div className={cn('skeleton', className)} />

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5 space-y-4">
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; icon?: ReactNode }
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, icon, className, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-medium text-ink-500 uppercase tracking-widest">{label}</label>}
    <div className="relative">
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300">{icon}</span>}
      <input ref={ref} className={cn('fsn-input', icon && 'pl-10', error && 'border-red-400 focus:ring-red-400/20', className)} {...props} />
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
))
Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-medium text-ink-500 uppercase tracking-widest">{label}</label>}
    <textarea ref={ref} rows={4} className={cn('fsn-input resize-y min-h-[100px]', error && 'border-red-400', className)} {...props} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
))
Textarea.displayName = 'Textarea'

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; options: { value: string; label: string }[] }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, className, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-medium text-ink-500 uppercase tracking-widest">{label}</label>}
    <select ref={ref} className={cn('fsn-input appearance-none cursor-pointer', error && 'border-red-400', className)} {...props}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
))
Select.displayName = 'Select'

// ─── Modal ────────────────────────────────────────────────────────────────────
const modalSizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
interface ModalProps { open: boolean; onClose: () => void; title?: string; children: ReactNode; size?: keyof typeof modalSizes; className?: string }

export function Modal({ open, onClose, title, children, size = 'md', className }: ModalProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
          <Transition.Child as={Fragment} enter="ease-out duration-250" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className={cn('w-full bg-white rounded-2xl shadow-modal overflow-hidden', modalSizes[size], className)}>
              {title && (
                <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
                  <Dialog.Title className="font-display text-xl font-semibold text-ink-900">{title}</Dialog.Title>
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-ink-50 text-ink-300 hover:text-ink-600 transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
              {children}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {icon && <div className="mb-4 text-5xl">{icon}</div>}
      <h3 className="font-display text-2xl font-semibold text-ink-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-ink-400 max-w-xs mb-6">{description}</p>}
      {action}
    </div>
  )
}

// ─── ImpactScoreBadge ─────────────────────────────────────────────────────────
export function ImpactScore({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = score >= 80 ? '#1A4731' : score >= 60 ? '#2D8653' : score >= 40 ? '#C4873A' : '#6E6B65'
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-2.5 py-1', lg: 'text-base px-3 py-1.5' }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-semibold border font-body', sizes[size])}
          style={{ color, borderColor: color + '33', background: color + '10' }}>
      ⚡ {score.toFixed(1)}
    </span>
  )
}
