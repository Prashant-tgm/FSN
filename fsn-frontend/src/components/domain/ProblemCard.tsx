import { Link } from 'react-router-dom'
import { HandThumbUpIcon, ChatBubbleLeftIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { HandThumbUpIcon as ThumbUpSolid } from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
import { Badge, Avatar, ImpactScore } from '@/components/ui'
import { timeAgo, truncate } from '@/lib/utils'
import { useUpvoteProblem } from '@/hooks/useProblems'
import { useAuthStore } from '@/store/authStore'
import type { Problem } from '@/lib/types'

export default function ProblemCard({ problem, index = 0 }: { problem: Problem; index?: number }) {
  const { isAuthenticated, openAuthModal } = useAuthStore()
  const upvote = useUpvoteProblem()

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) { openAuthModal('login'); return }
    upvote.mutate(problem.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to={`/problems/${problem.id}`} className="block group">
        <article className="card p-6 h-full flex flex-col cursor-pointer">
          {/* Top */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge urgency={problem.urgencyLevel} />
              <Badge problemStatus={problem.status} />
            </div>
            <span className="text-2xs text-ink-300 font-body whitespace-nowrap">{timeAgo(problem.createdAt)}</span>
          </div>

          {/* Category label */}
          <p className="section-label text-fsn-700 mb-2">{problem.category}</p>

          {/* Title */}
          <h3 className="font-display text-xl font-semibold text-ink-900 leading-snug mb-3 line-clamp-2 group-hover:text-fsn-700 transition-colors">
            {problem.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-ink-400 leading-relaxed line-clamp-2 mb-4 flex-1">
            {truncate(problem.description, 150)}
          </p>

          {/* Location */}
          {problem.location?.placeName && (
            <div className="flex items-center gap-1.5 text-xs text-ink-300 mb-3">
              <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{problem.location.placeName}</span>
            </div>
          )}

          {/* Tags */}
          {problem.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {problem.tags.slice(0, 3).map(t => (
                <span key={t} className="text-2xs px-2 py-0.5 bg-cream-100 text-ink-400 rounded-full border border-ink-100">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="divider mb-3" />

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar src={problem.createdBy?.avatarUrl} name={problem.createdBy?.fullName ?? '?'} size="xs" />
              <span className="text-xs text-ink-500 font-medium">{problem.createdBy?.fullName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-ink-300">
                <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
                {problem.solutionCount ?? 0}
              </span>
              <button onClick={handleUpvote} disabled={upvote.isPending}
                className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-fsn-50 group/v"
                style={{ color: problem.hasUpvoted ? '#1A4731' : '#9A9690' }}>
                {problem.hasUpvoted
                  ? <ThumbUpSolid className="w-3.5 h-3.5" />
                  : <HandThumbUpIcon className="w-3.5 h-3.5 group-hover/v:text-fsn-700" />}
                <span className="group-hover/v:text-fsn-700">{problem.upvoteCount}</span>
              </button>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  )
}
