import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Skeleton, CardSkeleton, EmptyState, Badge, Button, Input } from '@/components/ui'
import { fmtDate, getError } from '@/lib/utils'
import toast from 'react-hot-toast'
import { UserRole } from '@/lib/types'

type Tab = 'overview' | 'users' | 'moderation'

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [isUnlocked, setIsUnlocked] = useState(() => sessionStorage.getItem('fsn_admin_unlocked') === 'true')
  const [password, setPassword] = useState('')

  if (user?.role !== 'admin') return <Navigate to="/" replace />

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const expected = `${hours}${minutes}`
    
    if (password === expected) {
      setIsUnlocked(true)
      sessionStorage.setItem('fsn_admin_unlocked', 'true')
      toast.success('Admin access granted')
    } else {
      toast.error('Invalid dynamic password')
      setPassword('')
    }
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-5">
        <div className="max-w-md w-full bg-white rounded-3xl border border-ink-100 shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-ink-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl">🛡️</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-2">Security Verification</h2>
          <p className="text-sm text-ink-400 mb-8">This area is restricted. Enter the dynamic real-time password (HHMM) to proceed.</p>
          
          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-500 uppercase tracking-widest ml-1">Access Token</label>
              <Input 
                type="password" 
                placeholder="••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
                autoFocus
                className="text-center tracking-[0.5em] text-xl font-bold"
              />
            </div>
            <Button type="submit" variant="dark" fullWidth className="rounded-xl py-3 mt-4">
              Unlock Terminal
            </Button>
          </form>
          
          <p className="text-2xs text-ink-300 mt-8 uppercase tracking-tighter">
            Authorized Personnel Only · {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 pt-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-label text-fsn-700 mb-2">Platform Control Center</p>
          <h1 className="font-display text-4xl font-semibold text-ink-900">Admin Dashboard</h1>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl border-ink-100" 
          onClick={() => { sessionStorage.removeItem('fsn_admin_unlocked'); setIsUnlocked(false); toast.success('Terminal Locked') }}>
          🔒 Lock Terminal
        </Button>
      </div>

      <div className="flex gap-2 bg-white rounded-2xl border border-ink-100 p-1.5 mb-8 w-fit shadow-card">
        {(['overview', 'users', 'moderation'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              tab === t ? 'bg-ink-900 text-white shadow-sm' : 'text-ink-400 hover:text-ink-900'
            }`}>
            {t === 'overview' ? 'Analytics' : t === 'users' ? 'Users Directory' : 'Moderation Queue'}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'moderation' && <ModerationTab />}
    </div>
  )
}

// ─── Analytics Overview ───────────────────────────────────────────────────────
function OverviewTab() {
  const { data: stats, isLoading } = useQuery({ 
    queryKey: ['admin', 'stats'], 
    queryFn: () => adminApi.getStats().then(r => r.data.data) 
  })

  if (isLoading) return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
      {Array(8).fill(0).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  )

  if (!stats) return <EmptyState title="Stats unavailable" />

  const STAT_CARDS = [
    { key: 'totalUsers', label: 'Total Users', value: stats.totals?.users, icon: '👤' },
    { key: 'totalProblems', label: 'Total Problems', value: stats.totals?.problems, icon: '📍' },
    { key: 'totalSolutions', label: 'Total Solutions', value: stats.totals?.solutions, icon: '💡' },
    { key: 'openProblems', label: 'Open Problems', value: stats.problems?.open, icon: '🔴' },
    { key: 'solvedProblems', label: 'Solved Problems', value: stats.problems?.solved, icon: '✅' },
    { key: 'wallOfFame', label: 'Wall of Fame', value: stats.wallOfFame, icon: '🏆' },
    { key: 'recentUsers', label: 'New Users (7d)', value: stats.recentUsers7d, icon: '✨' },
    { key: 'totalFeedback', label: 'Total Feedback', value: stats.totals?.feedback, icon: '💬' },
  ]

  const maxRoleCount = Math.max(...(stats.roleBreakdown?.map((r: any) => r.count) || [1]))
  const maxCategoryCount = Math.max(...(stats.categoryBreakdown?.map((c: any) => c.count) || [1]))

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => (
          <div key={card.key} className="bg-white rounded-2xl border border-ink-100 p-6 shadow-card">
            <div className="text-3xl mb-4">{card.icon}</div>
            <p className="font-display text-3xl font-semibold text-ink-900">
              {card.value?.toLocaleString() ?? '—'}
            </p>
            <p className="text-xs text-ink-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Role Breakdown */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-card">
          <h3 className="font-display font-semibold text-ink-900 mb-6">User Roles Breakdown</h3>
          <div className="space-y-4">
            {stats.roleBreakdown?.map((role: any) => (
              <div key={role.role}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize text-ink-600 font-medium">{role.role.replace('_', ' ')}</span>
                  <span className="text-ink-400 font-semibold">{role.count}</span>
                </div>
                <div className="w-full bg-ink-50 rounded-full h-2.5">
                  <div className="bg-fsn-600 h-2.5 rounded-full" style={{ width: `${(role.count / maxRoleCount) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {(!stats.roleBreakdown || stats.roleBreakdown.length === 0) && (
              <p className="text-sm text-ink-400">No role data available.</p>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-card">
          <h3 className="font-display font-semibold text-ink-900 mb-6">Problem Categories</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {stats.categoryBreakdown?.map((cat: any) => (
              <div key={cat.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-ink-600 font-medium truncate pr-4">{cat.category}</span>
                  <span className="text-ink-400 font-semibold">{cat.count}</span>
                </div>
                <div className="w-full bg-ink-50 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(cat.count / maxCategoryCount) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {(!stats.categoryBreakdown || stats.categoryBreakdown.length === 0) && (
              <p className="text-sm text-ink-400">No category data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Users Directory ──────────────────────────────────────────────────────────
function UsersTab() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({ 
    queryKey: ['admin', 'users', page, search], 
    queryFn: () => adminApi.getUsers({ page, limit: 10, search: search || undefined }).then(r => r.data.data) 
  })

  const verifyUser = useMutation({
    mutationFn: (id: string) => adminApi.verifyUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User verified')
    },
    onError: err => toast.error(getError(err))
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string, role: string }) => adminApi.updateUserRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Role updated')
    },
    onError: err => toast.error(getError(err))
  })

  return (
    <div className="bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden">
      <div className="p-5 border-b border-ink-100 flex justify-between items-center bg-ink-50">
        <h3 className="font-display font-semibold text-ink-900">User Directory</h3>
        <input 
          type="text" 
          placeholder="Search name or email..." 
          className="px-3 py-1.5 text-sm border border-ink-200 rounded-lg outline-none focus:border-fsn-500"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-ink-50/50 text-ink-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Verified</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {isLoading ? (
              <tr><td colSpan={5} className="p-6 text-center text-ink-400">Loading users...</td></tr>
            ) : !(data as any)?.data?.length ? (
              <tr><td colSpan={5} className="p-6 text-center text-ink-400">No users found.</td></tr>
            ) : (
              (data as any).data.map((u: any) => (
                <tr key={u.id} className="hover:bg-ink-50/50">
                  <td className="px-6 py-4 font-medium text-ink-900">{u.fullName}</td>
                  <td className="px-6 py-4 text-ink-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <select 
                      className="text-xs border border-ink-200 rounded-md px-2 py-1 bg-white outline-none focus:border-fsn-500"
                      value={u.role}
                      onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value })}
                      disabled={updateRole.isPending}
                    >
                      <option value="bop_user">BOP User</option>
                      <option value="ngo">NGO</option>
                      <option value="innovator">Innovator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {u.isVerified ? (
                      <span className="text-green-600 font-semibold text-xs bg-green-50 px-2 py-1 rounded-full">Yes</span>
                    ) : (
                      <span className="text-ink-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!u.isVerified && ['ngo', 'innovator'].includes(u.role) && (
                      <button 
                        className="text-xs text-fsn-600 hover:text-fsn-800 font-semibold"
                        onClick={() => verifyUser.mutate(u.id)}
                        disabled={verifyUser.isPending}
                      >
                        Verify User
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(data as any)?.meta && (data as any).meta.totalPages > 1 && (
        <div className="flex justify-between items-center p-4 border-t border-ink-100 bg-ink-50/50">
          <span className="text-xs text-ink-500">
            Page {(data as any).meta.page} of {(data as any).meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-xs border border-ink-200 rounded-md bg-white disabled:opacity-50"
            >
              Prev
            </button>
            <button 
              disabled={page === (data as any).meta.totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-xs border border-ink-200 rounded-md bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Moderation Queue ─────────────────────────────────────────────────────────
function ModerationTab() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({ 
    queryKey: ['admin', 'moderation', page], 
    queryFn: () => adminApi.getModerationQueue({ page, limit: 20 }).then(r => r.data.data) 
  })

  if (isLoading) return <div className="p-10 text-center"><Skeleton className="h-8 w-48 mx-auto" /></div>

  const problems = (data as any)?.problems || []
  const solutions = (data as any)?.solutions || []

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-ink-100 shadow-card p-6">
        <h3 className="font-display font-semibold text-ink-900 mb-4 border-b border-ink-100 pb-3">Recent Problems</h3>
        {!problems.length ? (
          <p className="text-sm text-ink-400 italic">No recent problems found.</p>
        ) : (
          <div className="space-y-4">
            {problems.map((p: any) => (
              <div key={p.id} className="border border-ink-100 rounded-xl p-4">
                <p className="font-semibold text-sm text-ink-900 mb-1">{p.title}</p>
                <div className="flex items-center gap-2 text-xs text-ink-400 mb-2">
                  <span className="px-2 py-0.5 bg-ink-100 text-ink-600 rounded text-[10px] font-semibold uppercase">{p.category}</span>
                  <span>By: {p.poster?.fullName}</span>
                </div>
                <div className="text-xs text-ink-300">{fmtDate(p.createdAt, 'MMM d, h:mm a')}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 shadow-card p-6">
        <h3 className="font-display font-semibold text-ink-900 mb-4 border-b border-ink-100 pb-3">Recent Solutions</h3>
        {!solutions.length ? (
          <p className="text-sm text-ink-400 italic">No recent solutions found.</p>
        ) : (
          <div className="space-y-4">
            {solutions.map((s: any) => (
              <div key={s.id} className="border border-ink-100 rounded-xl p-4">
                <p className="font-semibold text-sm text-ink-900 mb-1">{s.title}</p>
                <div className="flex items-center gap-2 text-xs text-ink-400 mb-2">
                  <span className="px-2 py-0.5 bg-ink-100 text-ink-600 rounded text-[10px] font-semibold uppercase">{s.status}</span>
                  <span>By: {s.innovator?.fullName}</span>
                </div>
                <div className="text-xs text-ink-300">{fmtDate(s.createdAt, 'MMM d, h:mm a')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
