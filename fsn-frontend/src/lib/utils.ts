import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'
import type { UrgencyLevel, WoFTier, SolutionStatus, ProblemStatus } from './types'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

// ─── Date ─────────────────────────────────────────────────────────────────────
export const timeAgo   = (d: string | Date) => formatDistanceToNow(new Date(d), { addSuffix: true })
export const fmtDate   = (d: string | Date, f = 'MMM d, yyyy') => format(new Date(d), f)
export const truncate  = (s: string, n: number) => s.length <= n ? s : s.slice(0, n).trimEnd() + '…'
export const plural    = (n: number, s: string, p?: string) => `${n} ${n === 1 ? s : (p ?? s + 's')}`

// ─── Urgency ──────────────────────────────────────────────────────────────────
export const urgencyConfig: Record<UrgencyLevel, { label: string; pillClass: string; dot: string }> = {
  CRITICAL: { label: 'Critical', pillClass: 'pill-red',    dot: 'bg-red-500' },
  HIGH:     { label: 'High',     pillClass: 'pill-orange', dot: 'bg-orange-500' },
  MEDIUM:   { label: 'Medium',   pillClass: 'pill-gold',   dot: 'bg-gold-500' },
  LOW:      { label: 'Low',      pillClass: 'pill-green',  dot: 'bg-fsn-500' },
}

// ─── Problem status ───────────────────────────────────────────────────────────
export const problemStatusConfig: Record<ProblemStatus, { label: string; class: string }> = {
  DRAFT:       { label: 'Draft',       class: 'bg-ink-100 text-ink-400 border-ink-200' },
  ACTIVE:      { label: 'Active',      class: 'bg-blue-50 text-blue-600 border-blue-200' },
  IN_PROGRESS: { label: 'In Progress', class: 'bg-gold-50 text-gold-600 border-gold-200' },
  RESOLVED:    { label: 'Resolved',    class: 'bg-fsn-50 text-fsn-700 border-fsn-200' },
  ARCHIVED:    { label: 'Archived',    class: 'bg-ink-50 text-ink-300 border-ink-100' },
}

// ─── Solution status ──────────────────────────────────────────────────────────
export const solutionStatusConfig: Record<SolutionStatus, { label: string; class: string }> = {
  DRAFT:        { label: 'Draft',        class: 'bg-ink-100 text-ink-400 border-ink-200' },
  SUBMITTED:    { label: 'Submitted',    class: 'bg-blue-50 text-blue-600 border-blue-200' },
  UNDER_REVIEW: { label: 'Under Review', class: 'bg-purple-50 text-purple-600 border-purple-200' },
  APPROVED:     { label: 'Approved',     class: 'bg-fsn-50 text-fsn-700 border-fsn-200' },
  IMPLEMENTED:  { label: 'Implemented',  class: 'bg-teal-50 text-teal-600 border-teal-200' },
  REJECTED:     { label: 'Rejected',     class: 'bg-red-50 text-red-600 border-red-200' },
}

// ─── WoF tier ─────────────────────────────────────────────────────────────────
export const tierConfig: Record<WoFTier, { label: string; icon: string; bg: string; border: string; text: string }> = {
  GOLD:   { label: 'Gold',   icon: '🥇', bg: '#FDF8EE', border: '#E8A328', text: '#A86C28' },
  SILVER: { label: 'Silver', icon: '🥈', bg: '#F5F5F5', border: '#9CA3AF', text: '#374151' },
  BRONZE: { label: 'Bronze', icon: '🥉', bg: '#FFF7ED', border: '#C4873A', text: '#78350F' },
}

// ─── Impact score color ────────────────────────────────────────────────────────
export const impactColor = (s: number) => s >= 80 ? '#1A4731' : s >= 60 ? '#2D8653' : s >= 40 ? '#C4873A' : '#6E6B65'

// ─── Avatar initials ──────────────────────────────────────────────────────────
export const initials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')

// ─── Currency ─────────────────────────────────────────────────────────────────
export const fmtCurrency = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)

// ─── Error message ────────────────────────────────────────────────────────────
export const getError = (err: unknown): string => {
  if (err instanceof Error) return err.message
  const e = err as { response?: { data?: { message?: string } } }
  return e.response?.data?.message ?? 'Something went wrong'
}
