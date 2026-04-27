// Mirrors Prisma enums for use in DTOs, guards, and service logic
// Keep in sync with prisma/schema.prisma

export enum UserRole {
  BOP_USER = 'bop_user',
  NGO = 'ngo',
  INNOVATOR = 'innovator',
  ADMIN = 'admin',
}

export enum ProblemCategory {
  AGRICULTURE = 'agriculture',
  HEALTH = 'health',
  WATER = 'water',
  EDUCATION = 'education',
  LIVELIHOOD = 'livelihood',
  INFRASTRUCTURE = 'infrastructure',
  ENERGY = 'energy',
  OTHER = 'other',
}

export enum ProblemUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ProblemStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  UNDER_TRIAL = 'under_trial',
  SOLVED = 'solved',
  CLOSED = 'closed',
}

export enum ProblemVisibility {
  PUBLIC = 'public',
  COMMUNITY = 'community',
  PRIVATE = 'private',
}

export enum SolutionStatus {
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  UNDER_TRIAL = 'under_trial',
  IMPLEMENTED = 'implemented',
  REJECTED = 'rejected',
}

export enum CoCreationStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

export enum FeedbackCheckpoint {
  WEEK1 = 'week1',
  MONTH1 = 'month1',
  MONTH3 = 'month3',
  MONTH6 = 'month6',
}

export enum WoFTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
}

export enum NotificationType {
  SOLUTION_SUBMITTED = 'solution_submitted',
  SOLUTION_ACCEPTED = 'solution_accepted',
  CO_CREATION_REQUEST = 'co_creation_request',
  CO_CREATION_ACCEPTED = 'co_creation_accepted',
  FEEDBACK_PROMPT = 'feedback_prompt',
  FEEDBACK_RECEIVED = 'feedback_received',
  UPVOTE = 'upvote',
  COMMENT = 'comment',
  WOF_TIER_UPGRADE = 'wof_tier_upgrade',
  MESSAGE = 'message',
  SYSTEM = 'system',
}

export enum SearchType {
  PROBLEMS = 'problems',
  SOLUTIONS = 'solutions',
  BLOGS = 'blogs',
  USERS = 'users',
}

export enum QueueName {
  EMAIL = 'email-queue',
  SMS = 'sms-queue',
  SEARCH = 'search-queue',
  MEDIA = 'media-queue',
  IMPACT = 'impact-queue',
  REPUTATION = 'reputation-queue',
  WOF = 'wof-queue',
}

export enum EmailJobName {
  SEND_VERIFICATION = 'sendVerification',
  SEND_FEEDBACK_PROMPT = 'sendFeedbackPrompt',
  SEND_WELCOME = 'sendWelcome',
  SEND_CO_CREATION_INVITE = 'sendCoCreationInvite',
  SEND_SOLUTION_NOTIFICATION = 'sendSolutionNotification',
}

export enum SearchJobName {
  INDEX_PROBLEM = 'indexProblem',
  INDEX_SOLUTION = 'indexSolution',
  INDEX_BLOG = 'indexBlog',
  DELETE_PROBLEM = 'deleteProblem',
  DELETE_SOLUTION = 'deleteSolution',
}
