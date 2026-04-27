import { Link } from 'react-router-dom'
import { ClockIcon } from '@heroicons/react/24/outline'
import { Badge, Avatar, ImpactScore } from '@/components/ui'
import { timeAgo, fmtDate, truncate, fmtCurrency } from '@/lib/utils'
import type { Solution, Blog } from '@/lib/types'

// ─── SolutionCard ─────────────────────────────────────────────────────────────
export function SolutionCard({ solution }: { solution: Solution }) {
  const total = solution.estimatedCost?.reduce((s, i) => s + i.amount, 0) ?? 0

  return (
    <Link to={`/solutions/${solution.id}`} className="block group">
      <article className="card p-6 h-full flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge solutionStatus={solution.status} />
          {solution.impactScore != null && <ImpactScore score={solution.impactScore} size="sm" />}
        </div>

        <h3 className="font-display text-lg font-semibold text-ink-900 group-hover:text-fsn-700 transition-colors line-clamp-2 mb-2">
          {solution.title}
        </h3>
        <p className="text-sm text-ink-400 line-clamp-3 flex-1 mb-4">{solution.description}</p>

        {total > 0 && (
          <div className="flex items-center gap-2 mb-3 text-xs">
            <span className="text-ink-300">Est. cost</span>
            <span className="font-semibold text-ink-700">{fmtCurrency(total, solution.estimatedCost?.[0]?.currency ?? 'USD')}</span>
          </div>
        )}

        <div className="divider mb-3" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar src={solution.innovator?.avatarUrl} name={solution.innovator?.fullName ?? '?'} size="xs" />
            <span className="text-xs text-ink-500">{solution.innovator?.fullName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-300">
            {solution.version > 1 && <span>v{solution.version}</span>}
            <span>{timeAgo(solution.createdAt)}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

// ─── BlogCard ─────────────────────────────────────────────────────────────────
export function BlogCard({ blog, featured = false }: { blog: Blog; featured?: boolean }) {
  return (
    <Link to={`/blog/${blog.slug}`} className="block group">
      <article className={`card overflow-hidden h-full flex flex-col ${featured ? 'md:flex-row' : ''}`}>
        {blog.coverImageUrl && (
          <div className={`overflow-hidden flex-shrink-0 ${featured ? 'md:w-72' : 'aspect-[16/9]'}`}>
            <img src={blog.coverImageUrl} alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
          </div>
        )}

        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="section-label text-fsn-700">{blog.category}</span>
          </div>

          <h3 className={`font-display font-semibold text-ink-900 group-hover:text-fsn-700 transition-colors line-clamp-2 mb-2 ${featured ? 'text-2xl' : 'text-lg'}`}>
            {blog.title}
          </h3>

          <p className="text-sm text-ink-400 line-clamp-2 flex-1 mb-4">{truncate(blog.summary, 140)}</p>

          <div className="divider mb-3" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar src={blog.author?.avatarUrl} name={blog.author?.fullName ?? '?'} size="xs" />
              <div>
                <p className="text-xs font-medium text-ink-700">{blog.author?.fullName}</p>
                <p className="text-2xs text-ink-300">{fmtDate(blog.publishedAt ?? blog.createdAt)}</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs text-ink-300">
              <ClockIcon className="w-3.5 h-3.5" />
              {blog.readTimeMinutes} min
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
