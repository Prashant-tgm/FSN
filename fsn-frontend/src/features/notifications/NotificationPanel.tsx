import { AnimatePresence, motion } from 'framer-motion'
import { BellIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useUIStore } from '@/store/uiStore'
import { useNotifications } from '@/hooks/useProblems'
import { timeAgo, cn } from '@/lib/utils'
import type { Notification } from '@/lib/types'

const typeIcon: Record<string, string> = {
  UPVOTE: '👍', SOLUTION_SUBMITTED: '💡', FEEDBACK_REQUEST: '📋',
  COMMENT: '💬', MENTION: '@', SYSTEM: '🔔',
}

function NotifItem({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  return (
    <div onClick={() => !n.isRead && onRead(n.id)}
      className={cn('flex gap-3 px-5 py-3.5 transition-colors cursor-pointer', !n.isRead ? 'bg-cream-50 hover:bg-cream-100' : 'hover:bg-ink-50')}>
      <div className="w-9 h-9 rounded-xl bg-ink-100 flex items-center justify-center flex-shrink-0 text-base">
        {typeIcon[n.type] ?? '🔔'}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm text-ink-900 leading-snug', !n.isRead && 'font-semibold')}>{n.title}</p>
        <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">{n.body}</p>
        <p className="text-2xs text-ink-200 mt-1">{timeAgo(n.createdAt)}</p>
      </div>
      {!n.isRead && <div className="w-2 h-2 bg-fsn-600 rounded-full flex-shrink-0 mt-2" />}
    </div>
  )
}

export default function NotificationPanel() {
  const { notifPanelOpen, toggleNotifs } = useUIStore()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  return (
    <AnimatePresence>
      {notifPanelOpen && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-40" onClick={toggleNotifs} />
          <motion.div
            initial={{ opacity:0, x:20, scale:0.97 }} animate={{ opacity:1, x:0, scale:1 }} exit={{ opacity:0, x:20, scale:0.97 }}
            transition={{ duration:0.18 }}
            className="fixed top-16 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-modal border border-ink-100 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <div className="flex items-center gap-2">
                <BellIcon className="w-4 h-4 text-ink-500" />
                <span className="font-semibold text-ink-900 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-2xs bg-ink-900 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={() => markAllRead()}
                    className="flex items-center gap-1 text-xs text-fsn-700 hover:text-fsn-900 px-2 py-1 rounded-lg hover:bg-fsn-50 transition-colors">
                    <CheckIcon className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
                <button onClick={toggleNotifs} className="p-1.5 rounded-lg hover:bg-ink-50 text-ink-300 hover:text-ink-600 transition-colors">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-14 text-center">
                  <p className="text-3xl mb-3">🔔</p>
                  <p className="text-sm text-ink-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-ink-50">
                  {notifications.map(n => <NotifItem key={n.id} n={n} onRead={markRead} />)}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
