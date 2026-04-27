import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { searchApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { SearchResult } from '@/lib/types'

const typeIcon: Record<string, string>  = { problem: '📍', solution: '💡', blog: '✍️', user: '👤' }
const typePath: Record<string, (id: string) => string> = {
  problem:  id => `/problems/${id}`,
  solution: id => `/solutions/${id}`,
  blog:     id => `/blog/${id}`,
  user:     id => `/users/${id}`,
}
const typePill: Record<string, string> = {
  problem:  'bg-blue-50 text-blue-600',
  solution: 'bg-fsn-50 text-fsn-700',
  blog:     'bg-gold-50 text-gold-600',
  user:     'bg-ink-100 text-ink-500',
}

export default function SearchOverlay() {
  const { searchOpen, closeSearch } = useUIStore()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 80)
    else { setQ(''); setResults([]) }
  }, [searchOpen])

  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try { const { data } = await searchApi.search(q); setResults(data.data) }
      catch { /* noop */ }
      finally { setLoading(false) }
    }, 280)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch()
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); useUIStore.getState().openSearch() }
    }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [closeSearch])

  const pick = (r: SearchResult) => { navigate(typePath[r.type](r.id)); closeSearch() }

  return (
    <AnimatePresence>
      {searchOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm z-50" onClick={closeSearch} />

          <div className="fixed inset-x-0 top-20 z-50 flex justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-modal border border-ink-100 overflow-hidden"
            >
              {/* Input row */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-100">
                <MagnifyingGlassIcon className="w-5 h-5 text-ink-300 flex-shrink-0" />
                <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
                  placeholder="Search problems, solutions, posts..."
                  className="flex-1 text-sm font-body outline-none placeholder:text-ink-300 text-ink-900 bg-transparent" />
                <div className="flex items-center gap-2">
                  {q && <button onClick={() => setQ('')} className="text-ink-300 hover:text-ink-600 transition-colors"><XMarkIcon className="w-4 h-4" /></button>}
                  <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-1 rounded-lg bg-ink-50 text-2xs text-ink-400 font-mono border border-ink-100">ESC</kbd>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[380px] overflow-y-auto">
                {loading && (
                  <div className="flex justify-center py-12">
                    <div className="w-5 h-5 border-2 border-fsn-700 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {!loading && q && results.length === 0 && (
                  <div className="py-14 text-center">
                    <p className="text-sm text-ink-400">No results for "<span className="font-medium text-ink-700">{q}</span>"</p>
                  </div>
                )}

                {!loading && results.length > 0 && (
                  <ul className="py-2">
                    {results.map(r => (
                      <li key={r.id}>
                        <button onClick={() => pick(r)}
                          className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-cream-50 transition-colors text-left">
                          <span className="text-xl mt-0.5 flex-shrink-0">{typeIcon[r.type]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink-900 truncate">{r.title}</p>
                            {r.highlight && (
                              <p className="text-xs text-ink-400 mt-0.5 line-clamp-1"
                                dangerouslySetInnerHTML={{ __html: r.highlight }} />
                            )}
                          </div>
                          <span className={cn('text-2xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 font-semibold', typePill[r.type])}>
                            {r.type}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {!q && (
                  <div className="py-12 text-center">
                    <p className="text-sm text-ink-400 mb-1">Start typing to search across FSN</p>
                    <p className="text-xs text-ink-300">Problems · Solutions · Blog · People</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
