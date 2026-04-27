// ─── Enums — mirrors src/common/enums/index.ts ───────────────────────────────
export type UserRole        = 'bop_user' | 'ngo' | 'innovator' | 'admin'
export type ProblemStatus   = 'DRAFT' | 'ACTIVE' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED'
export type UrgencyLevel    = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type SolutionStatus  = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'IMPLEMENTED' | 'REJECTED'
export type WoFTier         = 'BRONZE' | 'SILVER' | 'GOLD'
export type CoCreationRole  = 'FACILITATOR' | 'CONTRIBUTOR' | 'OBSERVER'
export type NotificationType = 'UPVOTE' | 'SOLUTION_SUBMITTED' | 'FEEDBACK_REQUEST' | 'COMMENT' | 'MENTION' | 'SYSTEM'
export type MessageStatus   = 'SENT' | 'DELIVERED' | 'READ'
export type TaskStatus      = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type ContentBlockType = 'paragraph' | 'heading' | 'image' | 'quote' | 'code'
export type SearchEntityType = 'problem' | 'solution' | 'blog' | 'user'

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  avatarUrl?: string
  bio?: string
  organization?: string
  location?: { city?: string; state?: string; country?: string; lat?: number; lng?: number }
  reputationScore: number
  isVerified: boolean
  createdAt: string
}

export interface AuthTokens { accessToken: string; refreshToken: string; user: User }

// ─── Problem ──────────────────────────────────────────────────────────────────
export interface GeoLocation {
  type: 'Point'
  coordinates: [number, number]
  placeName?: string
}

export interface Problem {
  id: string; title: string; description: string; category: string
  urgencyLevel: UrgencyLevel; status: ProblemStatus; location: GeoLocation
  mediaUrls: string[]; upvoteCount: number; viewCount: number
  solutionCount: number; tags: string[]; createdBy: User
  createdAt: string; updatedAt: string; hasUpvoted?: boolean
}

// ─── Solution ─────────────────────────────────────────────────────────────────
export interface CostItem { label: string; amount: number; currency: string }
export interface TimelineItem { milestone: string; dueDate: string }

export interface Solution {
  id: string; problemId: string; title: string; description: string; approach: string
  estimatedCost: CostItem[]; timeline: TimelineItem[]; mediaUrls: string[]
  status: SolutionStatus; version: number; impactScore?: number
  innovator: User; createdAt: string; updatedAt: string
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
export interface FeedbackCheckpoint { id: string; label: string; description: string; order: number }
export interface Feedback {
  id: string; solutionId: string; checkpoint: FeedbackCheckpoint
  rating: number; comment: string; submittedBy: User; createdAt: string
}

// ─── Co-Creation ──────────────────────────────────────────────────────────────
export interface CoCreationTask {
  id: string; title: string; description?: string; status: TaskStatus
  assignedTo?: User; dueDate?: string
}

export interface CoCreationWorkspace {
  id: string; problemId: string; title: string; description: string
  participants: Array<{ user: User; role: CoCreationRole }>
  tasks: CoCreationTask[]; createdAt: string
}

// ─── Blog ─────────────────────────────────────────────────────────────────────
export interface ContentBlock { type: ContentBlockType; content: string; meta?: Record<string, string> }

export interface Blog {
  id: string; slug: string; title: string; summary: string; coverImageUrl?: string
  category: string; tags: string[]; content: ContentBlock[]
  clapCount: number; readTimeMinutes: number; author: User
  publishedAt: string; createdAt: string; hasClapped?: boolean
}

// ─── Wall of Fame ─────────────────────────────────────────────────────────────
export interface WallOfFameEntry {
  id: string; innovator: User; solution: Solution; tier: WoFTier
  impactScore: number; rank: number; headline: string; featuredAt: string
}

// ─── Comment ──────────────────────────────────────────────────────────────────
export interface Comment {
  id: string; entityId: string; entityType: 'problem' | 'solution' | 'blog'
  content: string; author: User; parentId?: string; replies?: Comment[]; createdAt: string
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string; type: NotificationType; title: string; body: string
  isRead: boolean; link?: string; createdAt: string
}

// ─── Messaging ────────────────────────────────────────────────────────────────
export interface Message { id: string; conversationId: string; content: string; sender: User; status: MessageStatus; createdAt: string }
export interface Conversation { id: string; participants: User[]; lastMessage?: Message; unreadCount: number; updatedAt: string }

// ─── Search ───────────────────────────────────────────────────────────────────
export interface SearchResult { id: string; type: SearchEntityType; title: string; summary: string; highlight?: string; score: number }

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface AdminStats {
  totalUsers: number; totalProblems: number; totalSolutions: number; totalBlogs: number
  activeProblems: number; pendingSolutions: number; newUsersToday: number; impactScoreTotal: number
}

// ─── API ──────────────────────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiResponse<T> {
  success: boolean; data: T; message?: string
}

export interface PaginationParams {
  page?: number; limit?: number; search?: string; sort?: string; order?: 'asc' | 'desc'
}
