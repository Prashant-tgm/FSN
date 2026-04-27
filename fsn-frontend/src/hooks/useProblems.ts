import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { problemsApi, notificationsApi, type ProblemsFilter } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { getError } from '@/lib/utils'

// ─── Problems ─────────────────────────────────────────────────────────────────
export const PROBLEM_KEYS = {
  all:    ['problems'] as const,
  list:   (f?: ProblemsFilter) => ['problems', 'list', f] as const,
  detail: (id: string)         => ['problems', id] as const,
}

export function useProblems(filters?: ProblemsFilter) {
  return useQuery({
    queryKey: PROBLEM_KEYS.list(filters),
    queryFn:  () => problemsApi.getAll(filters).then(r => r.data.data),
  })
}

export function useProblem(id: string) {
  return useQuery({
    queryKey: PROBLEM_KEYS.detail(id),
    queryFn:  () => problemsApi.getById(id).then(r => r.data.data),
    enabled:  !!id,
  })
}

export function useUpvoteProblem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => problemsApi.toggleUpvote(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: PROBLEM_KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: PROBLEM_KEYS.all })
    },
    onError: (err) => toast.error(getError(err)),
  })
}

export function useCreateProblem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: any) => problemsApi.create(payload),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: PROBLEM_KEYS.all }); toast.success('Problem posted!') },
    onError:    (err) => toast.error(getError(err)),
  })
}

// ─── Notifications ────────────────────────────────────────────────────────────
export function useNotifications() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const qc = useQueryClient()

  const list  = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsApi.getAll().then(r => r.data?.data ?? []),
    enabled:  isAuthenticated,
    refetchInterval: 30_000,
  })

  const count = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn:  () => notificationsApi.getUnreadCount().then(r => r.data?.data?.count ?? 0),
    enabled:  isAuthenticated,
    refetchInterval: 30_000,
  })

  const markRead    = useMutation({ mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) })
  const markAllRead = useMutation({ mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) })

  return {
    notifications: list.data ?? [],
    unreadCount:   count.data ?? 0,
    isLoading:     list.isLoading,
    markRead:      markRead.mutate,
    markAllRead:   markAllRead.mutate,
  }
}
