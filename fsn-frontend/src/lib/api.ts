import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import type {
  ApiResponse, PaginationParams,
  AuthTokens, User, Problem, Solution,
  Blog, WallOfFameEntry, Comment, Notification,
  Conversation, Message, SearchResult, AdminStats,
  CoCreationWorkspace, PaginatedResult,
} from './types'

// ─── Client ───────────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('fsn_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const orig = err.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true
      const refresh = localStorage.getItem('fsn_refresh_token')
      if (refresh) {
        try {
          const { data } = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken: refresh })
          localStorage.setItem('fsn_access_token', data.data.accessToken)
          localStorage.setItem('fsn_refresh_token', data.data.refreshToken)
          orig.headers.Authorization = `Bearer ${data.data.accessToken}`
          return api(orig)
        } catch {
          localStorage.removeItem('fsn_access_token')
          localStorage.removeItem('fsn_refresh_token')
          window.location.href = '/?session=expired'
        }
      }
    }
    return Promise.reject(err)
  },
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register:    (b: { fullName: string; email: string; password: string; role: string; phone: string }) =>
    api.post<ApiResponse<AuthTokens>>('/auth/register', b),
  login:       (b: { email: string; password: string }) =>
    api.post<ApiResponse<AuthTokens>>('/auth/login', b),
  logout:      () => api.post('/auth/logout'),
  refresh:     (refreshToken: string) =>
    api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken }),
  sendOtp:     (phone: string) => api.post('/auth/otp/send', { phone }),
  verifyOtp:   (phone: string, otp: string) =>
    api.post<ApiResponse<AuthTokens>>('/auth/otp/verify', { phone, otp }),
  verifyEmail: (email: string, otp: string) =>
    api.post<ApiResponse<AuthTokens>>('/auth/verify-email', { email, otp }),
  googleLogin: (token: string) =>
    api.post<ApiResponse<AuthTokens>>('/auth/google/login', { token }),
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  getMe:           () => api.get<ApiResponse<User>>('/users/me'),
  updateProfile:   (b: Partial<User>) => api.patch<ApiResponse<User>>('/users/me', b),
  getById:         (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
  getUserProblems: (id: string, p?: PaginationParams) =>
    api.get<ApiResponse<Problem[]>>(`/users/${id}/problems`, { params: p }),
  getUserSolutions:(id: string, p?: PaginationParams) =>
    api.get<ApiResponse<Solution[]>>(`/users/${id}/solutions`, { params: p }),
  deleteAccount:   () => api.delete('/users/me'),
}

// ─── Problems ─────────────────────────────────────────────────────────────────
export interface ProblemsFilter extends PaginationParams {
  category?: string; urgencyLevel?: string; status?: string
  lat?: number; lng?: number; radius?: number
}
export const problemsApi = {
  getAll:       (p?: ProblemsFilter) => api.get<ApiResponse<PaginatedResult<Problem>>>('/problems', { params: p }),
  getById:      (id: string) => api.get<ApiResponse<Problem>>(`/problems/${id}`),
  create:       (b: any) => api.post<ApiResponse<Problem>>('/problems', b),
  update:       (id: string, b: Partial<Problem>) => api.patch<ApiResponse<Problem>>(`/problems/${id}`, b),
  delete:       (id: string) => api.delete(`/problems/${id}`),
  toggleUpvote: (id: string) => api.post<ApiResponse<{ upvoteCount: number; hasUpvoted: boolean }>>(`/problems/${id}/upvote`),
  getMapData:   (p?: { lat: number; lng: number; radius: number }) =>
    api.get<ApiResponse<Problem[]>>('/problems/map', { params: p }),
  getCategories:() => api.get<ApiResponse<string[]>>('/problems/categories'),
}

// ─── Solutions ────────────────────────────────────────────────────────────────
export const solutionsApi = {
  getByProblem: (problemId: string, p?: PaginationParams) =>
    api.get<ApiResponse<Solution[]>>(`/problems/${problemId}/solutions`, { params: p }),
  getById:      (id: string) => api.get<ApiResponse<Solution>>(`/solutions/${id}`),
  create:       (problemId: string, b: FormData) =>
    api.post<ApiResponse<Solution>>(`/problems/${problemId}/solutions`, b, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:       (id: string, b: Partial<Solution>) => api.patch<ApiResponse<Solution>>(`/solutions/${id}`, b),
  updateStatus: (id: string, status: string) =>
    api.patch<ApiResponse<Solution>>(`/solutions/${id}/status`, { status }),
  delete:       (id: string) => api.delete(`/solutions/${id}`),
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
export const feedbackApi = {
  getBySolution:  (id: string) => api.get(`/solutions/${id}/feedback`),
  submit:         (id: string, b: { checkpointId: string; rating: number; comment: string }) =>
    api.post(`/solutions/${id}/feedback`, b),
  getCheckpoints: () => api.get('/feedback/checkpoints'),
}

// ─── Co-Creation ──────────────────────────────────────────────────────────────
export const coCreationApi = {
  getWorkspace:   (problemId: string) =>
    api.get<ApiResponse<CoCreationWorkspace>>(`/problems/${problemId}/cocreation`),
  createWorkspace:(problemId: string, b: { title: string; description: string }) =>
    api.post<ApiResponse<CoCreationWorkspace>>(`/problems/${problemId}/cocreation`, b),
  addParticipant: (wsId: string, userId: string, role: string) =>
    api.post(`/cocreation/${wsId}/participants`, { userId, role }),
  createTask:     (wsId: string, b: { title: string; description?: string; assignedToId?: string; dueDate?: string }) =>
    api.post(`/cocreation/${wsId}/tasks`, b),
  updateTask:     (wsId: string, taskId: string, b: { status?: string; assignedToId?: string }) =>
    api.patch(`/cocreation/${wsId}/tasks/${taskId}`, b),
}

// ─── Blog ─────────────────────────────────────────────────────────────────────
export interface BlogFilter extends PaginationParams { category?: string; tag?: string }
export interface CreateBlogPayload {
  title: string; category: string; content?: { type: string; data: Record<string, unknown> }[]
  coverImage?: string; tags?: string[]; isPublished?: boolean
}
export const blogApi = {
  getAll:       (p?: BlogFilter) => api.get<ApiResponse<PaginatedResult<Blog>>>('/blogs', { params: p }),
  getBySlug:    (slug: string) => api.get<ApiResponse<Blog>>(`/blogs/${slug}`),
  create:       (b: CreateBlogPayload) => api.post<ApiResponse<Blog>>('/blogs', b),
  update:       (id: string, b: Partial<CreateBlogPayload>) => api.patch<ApiResponse<Blog>>(`/blogs/${id}`, b),
  delete:       (id: string) => api.delete(`/blogs/${id}`),
  clap:         (id: string) => api.post<ApiResponse<{ clapCount: number }>>(`/blogs/${id}/clap`),
  getCategories:() => api.get<ApiResponse<string[]>>('/blogs/categories'),
}

// ─── Wall of Fame ─────────────────────────────────────────────────────────────
export const wallOfFameApi = {
  getAll:  (p?: { tier?: string } & PaginationParams) =>
    api.get<ApiResponse<PaginatedResult<WallOfFameEntry>>>('/wall-of-fame', { params: p }),
  getById: (id: string) => api.get<ApiResponse<WallOfFameEntry>>(`/wall-of-fame/${id}`),
}

// ─── Comments ─────────────────────────────────────────────────────────────────
export const commentsApi = {
  getByEntity: (type: string, id: string) =>
    api.get<ApiResponse<Comment[]>>(`/comments/${type}/${id}`),
  create:      (b: { entityType: string; entityId: string; content: string; parentId?: string }) =>
    api.post<ApiResponse<Comment>>('/comments', b),
  delete:      (id: string) => api.delete(`/comments/${id}`),
}

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll:         (p?: { unreadOnly?: boolean } & PaginationParams) =>
    api.get<ApiResponse<Notification[]>>('/notifications', { params: p }),
  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
  markRead:       (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead:    () => api.patch('/notifications/read-all'),
}

// ─── Messaging ────────────────────────────────────────────────────────────────
export const messagingApi = {
  getConversations:  () => api.get<ApiResponse<Conversation[]>>('/messaging/conversations'),
  getMessages:       (id: string, p?: PaginationParams) =>
    api.get<ApiResponse<Message[]>>(`/messaging/conversations/${id}/messages`, { params: p }),
  createConversation:(participantId: string) =>
    api.post<ApiResponse<Conversation>>('/messaging/conversations', { participantId }),
  sendMessage:       (id: string, content: string) =>
    api.post<ApiResponse<Message>>(`/messaging/conversations/${id}/messages`, { content }),
}

// ─── Search ───────────────────────────────────────────────────────────────────
export const searchApi = {
  search:      (q: string, type?: string) =>
    api.get<ApiResponse<SearchResult[]>>('/search', { params: { q, type } }),
  autocomplete:(q: string) => api.get<ApiResponse<string[]>>('/search/autocomplete', { params: { q } }),
}

// ─── Media ────────────────────────────────────────────────────────────────────
export const mediaApi = {
  getUploadUrl: (filename: string, contentType: string) =>
    api.post<ApiResponse<{ uploadUrl: string; cdnUrl: string }>>('/media/presigned', { filename, contentType }),
}

// ─── Platform Stats (public) ──────────────────────────────────────────────────
export interface PlatformStats {
  problemsCount: number
  solutionsCount: number
  innovatorsCount: number
  satisfactionRate: number
  communitiesCount: number
}
export const statsApi = {
  getPlatformStats: () => api.get<ApiResponse<PlatformStats>>('/stats/platform'),
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats:        () => api.get<ApiResponse<any>>('/admin/dashboard'),
  getUsers:        (p?: PaginationParams & { role?: string; search?: string }) => api.get<ApiResponse<User[]>>('/admin/users', { params: p }),
  getModerationQueue: (p?: PaginationParams) => api.get<ApiResponse<any>>('/admin/moderation', { params: p }),
  verifyUser:      (userId: string) => api.patch(`/admin/users/${userId}/verify`),
  updateUserRole:  (userId: string, role: string) => api.patch(`/admin/users/${userId}/role`, { role }),
}

export default api
