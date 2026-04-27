// ─────────────────────────────────────────────────────────────────────────────
// ProfilePage  (/users/:id)
// MyProblemsPage (/my/problems)
// MySolutionsPage (/my/solutions)
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  PencilIcon, CheckIcon, XMarkIcon, MapPinIcon,
  CalendarIcon, ShieldCheckIcon, StarIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/lib/api'
import ProblemCard from '@/components/domain/ProblemCard'
import { SolutionCard } from '@/components/domain/Cards'
import { Avatar, Button, Input, Textarea, Skeleton, CardSkeleton, EmptyState, Badge } from '@/components/ui'
import { fmtDate, getError } from '@/lib/utils'
import toast from 'react-hot-toast'

type Tab = 'overview' | 'problems' | 'solutions'

const roleLabels: Record<string, { label: string; icon: string; color: string }> = {
  bop_user:   { label: 'Community Member', icon: '🏘️', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  ngo:        { label: 'NGO / Organization', icon: '🤝', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  innovator:  { label: 'Innovator', icon: '💡', color: 'bg-fsn-50 text-fsn-700 border-fsn-200' },
  admin:      { label: 'Admin', icon: '⚙️', color: 'bg-red-50 text-red-700 border-red-200' },
}

export function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const currentUser = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  const qc = useQueryClient()
  const isOwn = currentUser?.id === id
  if (id === 'undefined') return <Navigate to="/" replace />

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id!).then(r => r.data.data),
    enabled: !!id && id !== 'undefined',
  })

  const [tab, setTab] = useState<Tab>('overview')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ 
    fullName: '', bio: '', avatarUrl: '', 
    city: '', state: '', country: 'India' 
  })

  const { data: userProblems, isLoading: probLoading } = useQuery({
    queryKey: ['user-problems', id],
    queryFn: () => usersApi.getUserProblems(id!).then(r => r.data.data),
    enabled: !!id && id !== 'undefined' && tab === 'problems',
  })

  const { data: userSolutions, isLoading: solLoading } = useQuery({
    queryKey: ['user-solutions', id],
    queryFn: () => usersApi.getUserSolutions(id!).then(r => r.data.data),
    enabled: !!id && id !== 'undefined' && tab === 'solutions',
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersApi.updateProfile(data),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['user', id] })
      if (isOwn && data.data) setUser(data.data as any)
      toast.success('Profile updated!')
      setEditing(false)
    },
    onError: err => toast.error(getError(err)),
  })

  const startEdit = () => {
    const loc = (profile as any)?.location || {}
    setEditForm({
      fullName: profile?.fullName ?? '',
      bio: (profile as any)?.bio ?? '',
      avatarUrl: profile?.avatarUrl ?? '',
      city: loc.city || '',
      state: loc.state || '',
      country: loc.country || 'India',
    })
    setEditing(true)
  }

  const handleSaveProfile = () => {
    const payload = {
      fullName: editForm.fullName,
      bio: editForm.bio,
      avatarUrl: editForm.avatarUrl,
      location: {
        city: editForm.city || undefined,
        state: editForm.state || undefined,
        country: editForm.country || undefined,
      }
    }
    updateMutation.mutate(payload)
  }

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-5 py-24 space-y-6">
      <div className="flex items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </div>
  )

  if (!profile) return (
    <div className="max-w-4xl mx-auto px-5 py-24">
      <EmptyState icon="👤" title="User not found" description="This profile doesn't exist or has been removed." />
    </div>
  )

  const role = roleLabels[profile.role] ?? roleLabels.bop_user

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8 pt-24">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-ink-100 shadow-card overflow-hidden mb-6"
      >
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-fsn-800 via-fsn-700 to-ink-900 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_60%)]" />
        </div>

        <div className="px-8 pb-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            <div className="-mt-12 relative z-10 shrink-0">
              <Avatar src={profile.avatarUrl} name={profile.fullName} size="xl"
                className="ring-4 ring-white shadow-lg bg-white" />
            </div>
            <div className="flex-1 min-w-0 pt-2 sm:pt-4">
              {editing ? (
                <Input value={editForm.fullName}
                  onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Your name" className="text-xl font-semibold" />
              ) : (
                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 truncate">
                  {profile.fullName}
                </h1>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`pill text-xs border ${role.color}`}>{role.icon} {role.label}</span>
                {profile.isVerified && (
                  <span className="pill text-xs bg-blue-50 text-blue-600 border border-blue-200">
                    <ShieldCheckIcon className="w-3.5 h-3.5 inline -mt-0.5" /> Verified
                  </span>
                )}
              </div>
            </div>
            {isOwn && (
              <div className="flex gap-2 shrink-0 sm:pt-4">
                {editing ? (
                  <>
                    <Button size="sm" variant="green" className="rounded-full"
                      loading={updateMutation.isPending}
                      onClick={handleSaveProfile}>
                      <CheckIcon className="w-4 h-4" /> Save
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-full"
                      onClick={() => setEditing(false)}>
                      <XMarkIcon className="w-4 h-4" /> Cancel
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" className="rounded-full" onClick={startEdit}>
                    <PencilIcon className="w-4 h-4" /> Edit Profile
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Bio & Location Edit */}
          <div className="mt-6 space-y-4">
            {editing ? (
              <>
                <Textarea value={editForm.bio}
                  onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell the community about yourself…" />
                <div className="bg-ink-50 p-4 rounded-2xl border border-ink-100 space-y-3">
                  <p className="text-xs font-semibold text-ink-900 uppercase tracking-wider">📍 Location</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Input placeholder="City / District" value={editForm.city} onChange={e => setEditForm(f => ({...f, city: e.target.value}))} />
                    <Input placeholder="State" value={editForm.state} onChange={e => setEditForm(f => ({...f, state: e.target.value}))} />
                    <Input placeholder="Country" value={editForm.country} onChange={e => setEditForm(f => ({...f, country: e.target.value}))} />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-500 leading-relaxed">
                {(profile as any)?.bio || (isOwn ? 'Click "Edit Profile" to add a bio.' : 'No bio yet.')}
              </p>
            )}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-ink-100">
            {profile.location && (
              <div className="flex items-center gap-2 text-sm text-ink-700 font-medium">
                <MapPinIcon className="w-4 h-4 text-ink-400" />
                {[profile.location.city, profile.location.state, profile.location.country].filter(Boolean).join(', ')}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-ink-400">
              <CalendarIcon className="w-4 h-4" />
              Joined {fmtDate(profile.createdAt)}
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-400">
              <StarIcon className="w-4 h-4" />
              {profile.reputationScore.toLocaleString()} reputation
            </div>
            {(profile as any)?._count && (
              <>
                <span className="text-sm text-ink-400">📍 {(profile as any)._count.problems} problems</span>
                <span className="text-sm text-ink-400">💡 {(profile as any)._count.solutions} solutions</span>
              </>
            )}
          </div>

          {/* Badges */}
          {(profile as any)?.badges?.length > 0 && (
            <div className="mt-6 pt-5 border-t border-ink-100">
              <p className="text-xs font-medium text-ink-500 uppercase tracking-widest mb-3">Badges</p>
              <div className="flex flex-wrap gap-2">
                {(profile as any).badges.map((b: any, i: number) => (
                  <span key={i} className="pill text-xs bg-gold-50 text-gold-700 border border-gold-200">
                    🏅 {b.badgeType.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-ink-100 p-1.5 mb-6 w-fit shadow-card">
        {(['overview', 'problems', 'solutions'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              tab === t ? 'bg-ink-900 text-white shadow-sm' : 'text-ink-400 hover:text-ink-900'
            }`}>
            {t}
            {t === 'problems' && (profile as any)?._count && (
              <span className="ml-1 text-xs opacity-70">({(profile as any)._count.problems})</span>
            )}
            {t === 'solutions' && (profile as any)?._count && (
              <span className="ml-1 text-xs opacity-70">({(profile as any)._count.solutions})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="bg-white rounded-3xl border border-ink-100 shadow-card p-8">
          <h2 className="font-display text-xl font-semibold text-ink-900 mb-4">Activity Summary</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-fsn-50 rounded-2xl p-5 border border-fsn-100 text-center">
              <p className="text-3xl font-display font-semibold text-fsn-800">{(profile as any)?._count?.problems ?? 0}</p>
              <p className="text-xs text-fsn-600 mt-1">Problems Documented</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 text-center">
              <p className="text-3xl font-display font-semibold text-blue-800">{(profile as any)?._count?.solutions ?? 0}</p>
              <p className="text-xs text-blue-600 mt-1">Solutions Submitted</p>
            </div>
            <div className="bg-gold-50 rounded-2xl p-5 border border-gold-100 text-center">
              <p className="text-3xl font-display font-semibold text-gold-700">{profile.reputationScore}</p>
              <p className="text-xs text-gold-600 mt-1">Reputation Score</p>
            </div>
          </div>
          <div className="mt-6 text-sm text-ink-400">
            <p>Member since <strong className="text-ink-700">{fmtDate(profile.createdAt, 'MMMM d, yyyy')}</strong></p>
          </div>
        </div>
      )}

      {tab === 'problems' && (
        <div>
          {probLoading ? (
            <div className="grid md:grid-cols-2 gap-5">{Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : !userProblems?.length ? (
            <EmptyState icon="📍" title="No problems yet"
              description={isOwn ? 'You haven\'t documented any problems yet.' : 'This user hasn\'t posted any problems.'} />
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {userProblems.map((p: any, i: number) => <ProblemCard key={p.id} problem={p} index={i} />)}
            </div>
          )}
        </div>
      )}

      {tab === 'solutions' && (
        <div>
          {solLoading ? (
            <div className="grid md:grid-cols-2 gap-5">{Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : !userSolutions?.length ? (
            <EmptyState icon="💡" title="No solutions yet"
              description={isOwn ? 'You haven\'t submitted any solutions yet.' : 'This user hasn\'t submitted any solutions.'} />
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {userSolutions.map((s: any) => <SolutionCard key={s.id} solution={s} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MyProblemsPage — shortcut to user's own problems
// ─────────────────────────────────────────────────────────────────────────────
export function MyProblemsPage() {
  const user = useAuthStore(s => s.user)
  const { data, isLoading } = useQuery({
    queryKey: ['my-problems', user?.id],
    queryFn: () => usersApi.getUserProblems(user!.id).then(r => r.data.data),
    enabled: !!user,
  })

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 pt-24">
      <div className="mb-10">
        <p className="section-label text-fsn-700 mb-2">Your Contributions</p>
        <h1 className="font-display text-4xl font-semibold text-ink-900">My Problems</h1>
        <p className="text-sm text-ink-400 mt-2">Problems you've documented from your community</p>
      </div>
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : !data?.length ? (
        <EmptyState icon="📍" title="No problems posted"
          description="Document challenges from your community to get started."
          action={<Link to="/problems"><Button variant="dark" className="rounded-full">Browse Problems</Button></Link>} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((p: any, i: number) => <ProblemCard key={p.id} problem={p} index={i} />)}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MySolutionsPage — shortcut to user's own solutions
// ─────────────────────────────────────────────────────────────────────────────
export function MySolutionsPage() {
  const user = useAuthStore(s => s.user)
  const { data, isLoading } = useQuery({
    queryKey: ['my-solutions', user?.id],
    queryFn: () => usersApi.getUserSolutions(user!.id).then(r => r.data.data),
    enabled: !!user,
  })

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 pt-24">
      <div className="mb-10">
        <p className="section-label text-fsn-700 mb-2">Your Contributions</p>
        <h1 className="font-display text-4xl font-semibold text-ink-900">My Solutions</h1>
        <p className="text-sm text-ink-400 mt-2">Solutions you've submitted to community problems</p>
      </div>
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-5">{Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : !data?.length ? (
        <EmptyState icon="💡" title="No solutions submitted"
          description="Browse problems and submit your first solution."
          action={<Link to="/problems"><Button variant="dark" className="rounded-full">Browse Problems</Button></Link>} />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {data.map((s: any) => <SolutionCard key={s.id} solution={s} />)}
        </div>
      )}
    </div>
  )
}
