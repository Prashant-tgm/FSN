// ─────────────────────────────────────────────────────────────────────────────
// ProblemsPage
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PlusIcon, FunnelIcon, ArrowLeftIcon, HandThumbUpIcon, EyeIcon, MapPinIcon, CalendarIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import { HandThumbUpIcon as ThumbUpSolid } from '@heroicons/react/24/solid'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useProblems, useProblem, useUpvoteProblem } from '@/hooks/useProblems'
import { useAuthStore } from '@/store/authStore'
import { solutionsApi, blogApi, wallOfFameApi } from '@/lib/api'
import ProblemCard from '@/components/domain/ProblemCard'
import { SolutionCard, BlogCard } from '@/components/domain/Cards'
import { Button, Badge, Avatar, Skeleton, CardSkeleton, EmptyState, ImpactScore, Input, Select, Modal, Textarea } from '@/components/ui'
import { Problem, Blog, WallOfFameEntry, WoFTier, PaginatedResult } from '@/lib/types'
import { fmtDate, plural, tierConfig, getError } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATEGORIES = ['All','Water & Sanitation','Healthcare','Education','Agriculture','Energy','Infrastructure','Finance','Gender Equality','Environment']
const URGENCIES  = [{ value:'', label:'All Urgencies' },{ value:'CRITICAL', label:'Critical' },{ value:'HIGH', label:'High' },{ value:'MEDIUM', label:'Medium' },{ value:'LOW', label:'Low' }]
const STATUSES   = [{ value:'', label:'All Statuses' },{ value:'ACTIVE', label:'Active' },{ value:'IN_PROGRESS', label:'In Progress' },{ value:'RESOLVED', label:'Resolved' }]
const SORTS      = [{ value:'createdAt', label:'Newest' },{ value:'upvoteCount', label:'Most Upvoted' },{ value:'solutionCount', label:'Most Solutions' }]

export function ProblemsPage() {
  const { isAuthenticated, openAuthModal } = useAuthStore()
  const [search, setSearch]   = useState('')
  const [category, setCat]    = useState('')
  const [urgency, setUrgency] = useState('')
  const [status, setStatus]   = useState('')
  const [sort, setSort]       = useState('createdAt')
  const [filters, showFilters]= useState(false)
  const [createOpen, setCreate] = useState(false)
  const [page, setPage]       = useState(1)

  const { data, isLoading } = useProblems({ search: search||undefined, category: category||undefined, urgencyLevel: urgency||undefined, status: status||undefined, sort, order:'desc', page, limit:12 })

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 pt-24">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-10 flex-wrap">
        <div>
          <p className="section-label text-fsn-700 mb-2">Community Feed</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900">Problems Feed</h1>
          <p className="text-sm text-ink-400 mt-2">{data?.meta?.total ? `${data.meta.total.toLocaleString()} problems documented` : 'Browse community-submitted challenges'}</p>
        </div>
        <Button onClick={() => { if (!isAuthenticated) { openAuthModal('login'); return } setCreate(true) }} variant="dark" className="rounded-full">
          <PlusIcon className="w-4 h-4" /> Post a Problem
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-ink-100 p-5 mb-6 shadow-card">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[180px]">
            <Input placeholder="Search problems…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <Select options={SORTS} value={sort} onChange={e => { setSort(e.target.value); setPage(1) }} className="w-40" />
          <Button variant={filters ? 'dark' : 'outline'} size="sm" onClick={() => showFilters(f => !f)} className="rounded-full">
            <FunnelIcon className="w-4 h-4" /> Filters
          </Button>
        </div>
        {filters && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
            className="grid sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-ink-100">
            <Select label="Urgency" options={URGENCIES} value={urgency} onChange={e => { setUrgency(e.target.value); setPage(1) }} />
            <Select label="Status"  options={STATUSES}  value={status}  onChange={e => { setStatus(e.target.value);  setPage(1) }} />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ink-500 uppercase tracking-widest">Category</label>
              <select value={category} onChange={e => { setCat(e.target.value === 'All' ? '' : e.target.value); setPage(1) }} className="fsn-input">
                {CATEGORIES.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => {
          const active = (cat === 'All' && !category) || cat === category
          return (
            <button key={cat} onClick={() => { setCat(cat === 'All' ? '' : cat); setPage(1) }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-body font-semibold transition-all ${active ? 'bg-ink-900 text-white' : 'bg-white text-ink-500 border border-ink-100 hover:border-ink-400 hover:text-ink-900'}`}>
              {cat}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{Array(9).fill(0).map((_,i)=><CardSkeleton key={i}/>)}</div>
      ) : !data?.data?.length ? (
        <EmptyState icon="🔍" title="No problems found" description="Try adjusting your filters or be the first to document a challenge." action={<Button onClick={() => { if (!isAuthenticated) { openAuthModal('login'); return } setCreate(true) }}>Post a Problem</Button>} />
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.data.map((p: Problem, i: number) => <ProblemCard key={p.id} problem={p} index={i} />)}
          </div>
          {data.meta && data.meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <Button variant="outline" size="sm" disabled={page===1} onClick={() => setPage(p=>p-1)} className="rounded-full">Previous</Button>
              <span className="text-sm text-ink-400">Page {page} of {data.meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page===data.meta.totalPages} onClick={() => setPage(p=>p+1)} className="rounded-full">Next</Button>
            </div>
          )}
        </>
      )}

      <CreateProblemModal open={createOpen} onClose={() => setCreate(false)} />
    </div>
  )
}

// ─── CreateProblemModal ───────────────────────────────────────────────────────
import { useCreateProblem } from '@/hooks/useProblems'

function CreateProblemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate, isPending } = useCreateProblem()
  const [f, setF] = useState({ 
    title:'', description:'', category:'Healthcare', urgencyLevel:'MEDIUM', tags:'',
    city:'', state:'', country:'India', lat:'', lng:''
  })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Construct the JSON payload conforming to CreateProblemDto
    const payload = {
      title: f.title,
      description: f.description,
      category: f.category,
      urgency: f.urgencyLevel,
      location: {
        district: f.city || undefined,
        village: f.city || undefined, // Fallback if they just type city name
        state: f.state,
        country: f.country,
        ...(f.lat && f.lng ? { lat: parseFloat(f.lat), lng: parseFloat(f.lng) } : {})
      },
      tags: f.tags.split(',').map(t=>t.trim()).filter(Boolean)
    }
    
    mutate(payload, { onSuccess: onClose })
  }

  // Pre-defined Indian States
  const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ]

  return (
    <Modal open={open} onClose={onClose} title="Document a Problem" size="lg">
      <form onSubmit={submit} className="p-7 space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
        <Input label="Title" placeholder="What's the core challenge?" value={f.title} onChange={set('title')} required />
        <Textarea label="Description" placeholder="Who is affected, how, and what are the consequences?" value={f.description} onChange={set('description')} required />
        
        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Category" options={CATEGORIES.slice(1).map(c=>({value:c,label:c}))} value={f.category} onChange={set('category')} />
          <Select label="Urgency Level" options={URGENCIES.slice(1)} value={f.urgencyLevel} onChange={set('urgencyLevel')} />
        </div>
        
        {/* Location Section */}
        <div className="bg-ink-50 p-4 rounded-2xl border border-ink-100 space-y-4">
          <h3 className="text-sm font-semibold text-ink-900 mb-1 flex items-center gap-2">
            📍 Problem Location
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="City / Village / District" placeholder="e.g. Pune, rural area" value={f.city} onChange={set('city')} required />
            <Select label="State" options={INDIAN_STATES.map(s=>({value:s,label:s}))} value={f.state} onChange={set('state')} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Country" placeholder="India" value={f.country} onChange={set('country')} required />
            <div className="flex gap-2">
              <Input label="Latitude (Optional)" type="number" step="0.000001" placeholder="18.5204" value={f.lat} onChange={set('lat')} />
              <Input label="Longitude (Optional)" type="number" step="0.000001" placeholder="73.8567" value={f.lng} onChange={set('lng')} />
            </div>
          </div>
        </div>

        <Input label="Tags (comma-separated)" placeholder="water, drought, rural…" value={f.tags} onChange={set('tags')} />
        
        <div className="flex gap-3 pt-4 justify-end border-t border-ink-100 mt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isPending} variant="dark" className="rounded-full">Submit Problem</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ProblemDetailPage
// ─────────────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'solutions' | 'cocreation'

export function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: problem, isLoading } = useProblem(id!)
  const { isAuthenticated, openAuthModal, user } = useAuthStore()
  const upvote = useUpvoteProblem()
  const [tab, setTab] = useState<Tab>('overview')
  const [solutionOpen, setSolOpen] = useState(false)

  const { data: solutions, isLoading: solLoading } = useQuery({
    queryKey: ['solutions', id],
    queryFn:  () => solutionsApi.getByProblem(id!).then(r => r.data.data),
    enabled:  !!id,
  })

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-5 py-24 space-y-4">
      <Skeleton className="h-10 w-2/3 rounded-2xl" />
      <Skeleton className="h-5 w-40 rounded-xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  )
  if (!problem) return (
    <div className="max-w-4xl mx-auto px-5 py-24">
      <EmptyState title="Problem not found" description="This problem may have been removed." />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 pt-24">
      <Link to="/problems" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-900 mb-8 transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Problems
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-3xl border border-ink-100 shadow-card p-8 mb-6">
        <div className="flex flex-wrap gap-2 mb-5">
          <Badge urgency={problem.urgencyLevel} />
          <Badge problemStatus={problem.status} />
          <span className="pill-green">{problem.category}</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink-900 leading-tight mb-5">{problem.title}</h1>
        <div className="flex flex-wrap gap-5 text-sm text-ink-300 mb-6">
          {problem.location?.placeName && <span className="flex items-center gap-1.5"><MapPinIcon className="w-4 h-4"/>{problem.location.placeName}</span>}
          <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4"/>{fmtDate(problem.createdAt)}</span>
          <span className="flex items-center gap-1.5"><EyeIcon className="w-4 h-4"/>{problem.viewCount} views</span>
          <span className="flex items-center gap-1.5"><ChatBubbleLeftIcon className="w-4 h-4"/>{plural(problem.solutionCount??0,'solution')}</span>
        </div>
        {problem.tags?.length>0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {problem.tags.map(t=><span key={t} className="text-2xs px-2.5 py-1 bg-cream-100 text-ink-400 rounded-full border border-ink-100">#{t}</span>)}
          </div>
        )}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-6 border-t border-ink-100">
          <div className="flex items-center gap-3">
            <Avatar src={problem.createdBy?.avatarUrl} name={problem.createdBy?.fullName??'?'} size="sm" />
            <div>
              <p className="text-sm font-semibold text-ink-900">{problem.createdBy?.fullName}</p>
              <p className="text-xs text-ink-300 capitalize">{problem.createdBy?.role?.toLowerCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { if(!isAuthenticated){openAuthModal('login');return} upvote.mutate(problem.id) }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all"
              style={{ borderColor: problem.hasUpvoted?'#1A4731':'#E5E0D8', color: problem.hasUpvoted?'#1A4731':'#6E6B65', background: problem.hasUpvoted?'#F0F7F2':'white' }}>
              {problem.hasUpvoted ? <ThumbUpSolid className="w-4 h-4"/> : <HandThumbUpIcon className="w-4 h-4"/>}
              {problem.upvoteCount} Upvotes
            </button>
            {user?.role==='innovator' && problem.status!=='RESOLVED' && (
              <Button onClick={() => { if(!isAuthenticated){openAuthModal('login');return} setSolOpen(true) }} variant="dark" className="rounded-full">
                💡 Submit Solution
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-ink-100 p-1.5 mb-6 w-fit shadow-card">
        {(['overview','solutions','cocreation'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${tab===t ? 'bg-ink-900 text-white shadow-sm' : 'text-ink-400 hover:text-ink-900'}`}>
            {t==='cocreation' ? 'Co-Creation Hub' : t.charAt(0).toUpperCase()+t.slice(1)}
            {t==='solutions' && solutions && solutions.length>0 && <span className="ml-1 text-xs opacity-70">({solutions.length})</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab==='overview' && (
        <div className="bg-white rounded-3xl border border-ink-100 shadow-card p-8">
          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-5">Problem Description</h2>
          <div className="prose-fsn whitespace-pre-wrap">{problem.description}</div>
          {problem.mediaUrls?.length>0 && (
            <div className="mt-8">
              <h3 className="font-semibold text-ink-900 text-sm mb-3 uppercase tracking-widest">Media</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {problem.mediaUrls.map((url,i) => (
                  <img key={i} src={url} alt={`Media ${i+1}`} className="w-full aspect-video object-cover rounded-xl border border-ink-100"/>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='solutions' && (
        <div className="space-y-5">
          {solLoading ? (
            <div className="grid md:grid-cols-2 gap-5">{Array(4).fill(0).map((_,i)=><CardSkeleton key={i}/>)}</div>
          ) : !solutions?.length ? (
            <EmptyState icon="💡" title="No solutions yet" description="Be the first innovator to submit a solution for this problem."
              action={user?.role==='innovator' ? <Button onClick={() => setSolOpen(true)} variant="dark" className="rounded-full">Submit a Solution</Button> : undefined} />
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-ink-400">{plural(solutions.length,'solution')} submitted</p>
                {user?.role==='innovator' && <Button size="sm" onClick={() => setSolOpen(true)} variant="dark" className="rounded-full">+ Add Solution</Button>}
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                {solutions.map(s => <SolutionCard key={s.id} solution={s}/>)}
              </div>
            </>
          )}
        </div>
      )}

      {tab==='cocreation' && <CoCreationHub problemId={id!} />}

      <SubmitSolutionModal open={solutionOpen} onClose={() => setSolOpen(false)} problemId={id!} />
    </div>
  )
}

// ─── SubmitSolutionModal ──────────────────────────────────────────────────────
function SubmitSolutionModal({ open, onClose, problemId }: { open: boolean; onClose: () => void; problemId: string }) {
  const qc = useQueryClient()
  const [f, setF] = useState({ title:'', description:'', approach:'' })
  const { mutate, isPending } = useMutation({
    mutationFn: (fd: FormData) => solutionsApi.create(problemId, fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['solutions', problemId] }); toast.success('Solution submitted!'); onClose(); setF({title:'',description:'',approach:''}) },
    onError: err => toast.error(getError(err)),
  })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setF(p=>({...p,[k]:e.target.value}))
  const submit = (e: React.FormEvent) => { e.preventDefault(); const fd=new FormData(); Object.entries(f).forEach(([k,v])=>fd.append(k,v)); mutate(fd) }
  return (
    <Modal open={open} onClose={onClose} title="Submit a Solution" size="lg">
      <form onSubmit={submit} className="p-7 space-y-5">
        <div className="p-4 bg-fsn-50 rounded-xl border border-fsn-100">
          <p className="text-xs text-fsn-700">💡 Your solution will be scored using FSN's transparent Impact Score engine (TDP §10).</p>
        </div>
        <Input label="Solution Title" placeholder="A concise name for your solution" value={f.title} onChange={set('title')} required />
        <Textarea label="Description" placeholder="What does your solution do? Who does it serve?" value={f.description} onChange={set('description')} required />
        <Textarea label="Technical Approach" placeholder="How will this be implemented?" value={f.approach} onChange={set('approach')} required />
        <div className="flex gap-3 pt-2 justify-end">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isPending} variant="dark" className="rounded-full">Submit Solution</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── CoCreationHub ────────────────────────────────────────────────────────────
import { coCreationApi } from '@/lib/api'
import type { CoCreationTask } from '@/lib/types'

function CoCreationHub({ problemId }: { problemId: string }) {
  const qc = useQueryClient()
  const { user, isAuthenticated, openAuthModal } = useAuthStore()
  const { data: ws, isLoading } = useQuery({
    queryKey: ['cocreation', problemId],
    queryFn:  () => coCreationApi.getWorkspace(problemId).then(r => r.data.data),
    enabled:  !!problemId,
  })
  const create = useMutation({
    mutationFn: () => coCreationApi.createWorkspace(problemId, { title:'Co-Creation Workspace', description:'Collaborate on solutions.' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cocreation', problemId] }),
    onError: err => toast.error(getError(err)),
  })
  const updateTask = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      coCreationApi.updateTask(ws!.id, taskId, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cocreation', problemId] }),
  })

  if (isLoading) return <div className="space-y-3"><Skeleton className="h-8 w-48 rounded-xl"/><Skeleton className="h-64 w-full rounded-2xl"/></div>
  if (!ws) return (
    <EmptyState icon="🤝" title="No Co-Creation Workspace" description="Start a collaborative workspace to coordinate solutions."
      action={isAuthenticated && (user?.role==='ngo'||user?.role==='admin') ? (
        <Button onClick={() => create.mutate()} loading={create.isPending} variant="dark" className="rounded-full">Create Workspace</Button>
      ) : <p className="text-xs text-ink-400">Only NGOs can create workspaces</p>} />
  )

  const cols = ['TODO','IN_PROGRESS','DONE'] as const
  const colLabel = { TODO:'📋 To Do', IN_PROGRESS:'⚙️ In Progress', DONE:'✅ Done' }
  const colBorder = { TODO:'border-ink-100', IN_PROGRESS:'border-gold-200', DONE:'border-fsn-200' }
  const byStatus = cols.reduce((acc,s)=>({ ...acc, [s]: ws.tasks?.filter(t=>t.status===s)??[] }), {} as Record<string,CoCreationTask[]>)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-ink-100 shadow-card p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <h3 className="font-display text-xl font-semibold text-ink-900">{ws.title}</h3>
            <p className="text-sm text-ink-400 mt-1">{ws.description}</p>
          </div>
          <span className="text-sm text-ink-400 font-medium">{ws.participants?.length??0} participants</span>
        </div>
        {ws.participants?.length>0 && (
          <div className="pt-5 border-t border-ink-100">
            <p className="section-label text-ink-400 mb-3">Participants</p>
            <div className="flex flex-wrap gap-4">
              {ws.participants.map(({ user: p, role }) => (
                <div key={p.id} className="flex items-center gap-2">
                  <Avatar src={p.avatarUrl} name={p.fullName} size="xs"/>
                  <div><p className="text-xs font-medium text-ink-800">{p.fullName}</p><p className="text-2xs text-ink-300 capitalize">{role.toLowerCase()}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-display font-semibold text-ink-900">Task Board</h4>
          <span className="text-xs text-ink-300">{ws.tasks?.length??0} tasks</span>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {cols.map(status => (
            <div key={status} className={`bg-white rounded-2xl border-2 p-5 ${colBorder[status]}`}>
              <h5 className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-4">{colLabel[status]}</h5>
              <div className="space-y-2 min-h-[100px]">
                {byStatus[status].map(task => (
                  <div key={task.id} className="bg-cream-50 rounded-xl p-3 border border-ink-100 group">
                    <p className="text-sm font-medium text-ink-800">{task.title}</p>
                    {task.description && <p className="text-xs text-ink-400 mt-1">{task.description}</p>}
                    {task.assignedTo && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Avatar src={task.assignedTo.avatarUrl} name={task.assignedTo.fullName} size="xs"/>
                        <span className="text-xs text-ink-400">{task.assignedTo.fullName}</span>
                      </div>
                    )}
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {cols.filter(s=>s!==status).map(s=>(
                        <button key={s} onClick={() => { if(!isAuthenticated){openAuthModal('login');return} updateTask.mutate({taskId:task.id,status:s}) }}
                          className="text-2xs px-2 py-0.5 rounded-lg bg-white border border-ink-200 text-ink-500 hover:border-fsn-600 hover:text-fsn-700 transition-colors">
                          → {s.replace('_',' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {byStatus[status].length===0 && <p className="text-xs text-ink-200 text-center py-4">No tasks</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WallOfFamePage
// ─────────────────────────────────────────────────────────────────────────────
export function WallOfFamePage() {
  const [activeTier, setActiveTier] = useState<string>('')
  const { data, isLoading } = useQuery<PaginatedResult<WallOfFameEntry>>({
    queryKey: ['wall-of-fame', activeTier],
    queryFn:  async () => {
      const res = await wallOfFameApi.getAll({ tier: activeTier||undefined, limit:50 })
      return res.data.data
    },
  })
  const tiers = ['GOLD','SILVER','BRONZE'] as const

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 pt-24">
      <div className="text-center mb-14">
        <p className="section-label text-gold-600 mb-3">Hall of Champions</p>
        <h1 className="font-display text-5xl md:text-6xl font-semibold text-ink-900 mb-4">Wall of Fame</h1>
        <p className="text-ink-400 max-w-xl mx-auto text-sm leading-relaxed">
          Celebrating innovators whose solutions have created verified, community-measured impact — ranked by FSN's transparent Impact Score algorithm.
        </p>
      </div>

      {/* Tier filters */}
      <div className="flex justify-center gap-3 mb-12">
        <button onClick={() => setActiveTier('')}
          className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${!activeTier ? 'bg-ink-900 text-white' : 'bg-white border border-ink-100 text-ink-500 hover:border-ink-400'}`}>
          All Tiers
        </button>
        {tiers.map(tier => {
          const cfg = tierConfig[tier]
          return (
            <button key={tier} onClick={() => setActiveTier(activeTier===tier?'':tier)}
              className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all border"
              style={{ background:activeTier===tier?cfg.bg:'white', color:activeTier===tier?cfg.text:'#6E6B65', borderColor:activeTier===tier?cfg.border:'#E5E0D8' }}>
              {cfg.icon} {cfg.label}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{Array(9).fill(0).map((_,i)=><CardSkeleton key={i}/>)}</div>
      ) : !data?.data?.length ? (
        <EmptyState icon="🏆" title="No entries yet" description="Impact scores are calculated as solutions receive community feedback." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.data.map((entry: WallOfFameEntry, i: number) => {
            const cfg = tierConfig[entry.tier]
            return (
              <motion.div key={entry.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04, duration:0.35 }}>
                <div className="rounded-2xl border-2 p-6 hover:-translate-y-1 transition-all duration-200 shadow-card hover:shadow-card-hover"
                  style={{ background:cfg.bg, borderColor:cfg.border }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={entry.innovator?.avatarUrl} name={entry.innovator?.fullName??'?'} size="md"/>
                      <div>
                        <p className="font-semibold text-ink-900 text-sm">{entry.innovator?.fullName}</p>
                        <p className="text-xs text-ink-400">{entry.innovator?.organization??'Innovator'}</p>
                      </div>
                    </div>
                    <span className="text-2xl">{cfg.icon}</span>
                  </div>
                  <p className="text-sm font-medium text-ink-700 mb-3 line-clamp-2">{entry.headline}</p>
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor:cfg.border+'88' }}>
                    <ImpactScore score={entry.impactScore}/>
                    <span className="text-2xs text-ink-300">#{entry.rank} · {fmtDate(entry.featuredAt)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BlogPage + BlogPostPage
// ─────────────────────────────────────────────────────────────────────────────
import { HandRaisedIcon, ClockIcon } from '@heroicons/react/24/outline'
import { HandRaisedIcon as HandRaisedSolid } from '@heroicons/react/24/solid'

export function BlogPage() {
  const [category, setCat] = useState('')
  const user = useAuthStore(s => s.user)
  const canWrite = ['innovator','ngo','admin'].includes(user?.role ?? '')
  const { data: cats } = useQuery({ queryKey:['blog','cats'], queryFn:()=>blogApi.getCategories().then(r=>r.data.data) })
  const { data, isLoading } = useQuery<PaginatedResult<Blog>>({ 
    queryKey:['blog','list',category], 
    queryFn: async () => {
      const res = await blogApi.getAll({category:category||undefined,limit:20})
      return res.data.data
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 pt-24">
      <div className="text-center mb-12">
        <p className="section-label text-fsn-700 mb-3">Insights & Stories</p>
        <h1 className="font-display text-5xl md:text-6xl font-semibold text-ink-900 mb-3">FSN Blog</h1>
        <p className="text-ink-400 text-sm max-w-md mx-auto">Impact reports, field stories, innovation case studies, and thought leadership.</p>
        {canWrite && (
          <Link to="/blog/new" className="inline-flex items-center gap-2 mt-6 btn-dark px-6 py-2.5 rounded-full text-sm font-body font-medium">
            ✍️ Write a Post
          </Link>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-10 justify-center flex-wrap">
        <button onClick={() => setCat('')}
          className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${!category?'bg-ink-900 text-white':'bg-white border border-ink-100 text-ink-500 hover:border-ink-400'}`}>
          All
        </button>
        {cats?.map(c => (
          <button key={c} onClick={() => setCat(c===category?'':c)}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${category===c?'bg-ink-900 text-white':'bg-white border border-ink-100 text-ink-500 hover:border-ink-400'}`}>
            {c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-5">{Array(6).fill(0).map((_,i)=><CardSkeleton key={i}/>)}</div>
      ) : !data?.data?.length ? (
        <EmptyState icon="✍️" title="No posts yet" description="Check back soon for impact stories and field insights."/>
      ) : (
        <>
          {!category && data.data[0] && <div className="mb-8"><BlogCard blog={data.data[0]} featured /></div>}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(category ? data.data : data.data.slice(1)).map((b: Blog) => <BlogCard key={b.id} blog={b}/>)}
          </div>
        </>
      )}
    </div>
  )
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { isAuthenticated, openAuthModal } = useAuthStore()
  const qc = useQueryClient()
  const { data: blog, isLoading } = useQuery({ queryKey:['blog',slug], queryFn:()=>blogApi.getBySlug(slug!).then(r=>r.data.data), enabled:!!slug })
  const clap = useMutation({
    mutationFn: () => blogApi.clap(blog!.id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey:['blog',slug] }); toast.success('👏') },
    onError:    err => toast.error(getError(err)),
  })

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-5 py-24 space-y-5">
      <Skeleton className="h-10 w-3/4 rounded-2xl"/><Skeleton className="h-5 w-1/2 rounded-xl"/>
      <Skeleton className="h-64 w-full rounded-2xl"/><Skeleton className="h-4 w-full rounded-xl"/><Skeleton className="h-4 w-5/6 rounded-xl"/>
    </div>
  )
  if (!blog) return <div className="max-w-3xl mx-auto px-5 py-24"><EmptyState title="Post not found"/></div>

  return (
    <article className="max-w-3xl mx-auto px-5 sm:px-8 py-8 pt-24">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-900 mb-10 transition-colors">
        <ArrowLeftIcon className="w-4 h-4"/> Back to Blog
      </Link>
      <span className="section-label text-fsn-700 mb-5 block">{blog.category}</span>
      <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink-900 mb-6 leading-tight">{blog.title}</h1>

      <div className="flex items-center gap-5 mb-10 pb-8 border-b border-ink-100">
        <div className="flex items-center gap-3">
          <Avatar src={blog.author?.avatarUrl} name={blog.author?.fullName??'?'} size="sm"/>
          <div>
            <p className="text-sm font-semibold text-ink-900">{blog.author?.fullName}</p>
            <p className="text-xs text-ink-300">{fmtDate(blog.publishedAt??blog.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-auto text-xs text-ink-300">
          <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5"/>{blog.readTimeMinutes} min</span>
          <span className="flex items-center gap-1"><HandRaisedIcon className="w-3.5 h-3.5"/>{blog.clapCount}</span>
        </div>
      </div>

      {blog.coverImageUrl && (
        <div className="aspect-video overflow-hidden rounded-2xl mb-10 border border-ink-100">
          <img src={blog.coverImageUrl} alt={blog.title} className="w-full h-full object-cover"/>
        </div>
      )}

      <blockquote className="font-display text-xl text-ink-600 border-l-2 border-fsn-600 pl-5 italic mb-10 leading-relaxed">{blog.summary}</blockquote>

      <div className="prose-fsn space-y-5">
        {blog.content?.map((b, i) => {
          if (b.type==='paragraph') return <p key={i}>{b.content}</p>
          if (b.type==='heading')   return <h2 key={i} className="font-display text-2xl font-semibold text-ink-900 mt-10 mb-4">{b.content}</h2>
          if (b.type==='quote')     return <blockquote key={i} className="border-l-2 border-fsn-600 pl-5 italic text-ink-400 my-8 font-display text-lg">{b.content}</blockquote>
          if (b.type==='image')     return <figure key={i} className="my-8"><img src={b.content} alt={b.meta?.alt??''} className="w-full rounded-2xl border border-ink-100"/>{b.meta?.caption&&<figcaption className="text-xs text-center text-ink-300 mt-2">{b.meta.caption}</figcaption>}</figure>
          if (b.type==='code')      return <pre key={i} className="bg-ink-900 text-fsn-300 p-6 rounded-2xl overflow-x-auto text-sm font-mono">{b.content}</pre>
          return null
        })}
      </div>

      {blog.tags?.length>0 && (
        <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-ink-100">
          {blog.tags.map(t=><span key={t} className="text-xs px-3 py-1 bg-cream-100 text-ink-400 rounded-full border border-ink-100">#{t}</span>)}
        </div>
      )}

      <div className="flex justify-center mt-14">
        <button onClick={() => { if(!isAuthenticated){openAuthModal('login');return} clap.mutate() }} disabled={clap.isPending||blog.hasClapped} className="flex flex-col items-center gap-2 group">
          <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all text-2xl ${blog.hasClapped?'border-fsn-700 bg-fsn-50':'border-ink-200 hover:border-fsn-400 hover:bg-fsn-50'}`}>
            {blog.hasClapped ? <HandRaisedSolid className="w-7 h-7 text-fsn-700"/> : <HandRaisedIcon className="w-7 h-7 text-ink-300 group-hover:text-fsn-600"/>}
          </div>
          <span className="text-sm font-semibold text-ink-600">{blog.clapCount}</span>
          <span className="text-xs text-ink-300">{blog.hasClapped?'Clapped!':'Clap for this'}</span>
        </button>
      </div>
    </article>
  )
}

// AdminDashboard has been moved to src/pages/AdminDashboard.tsx
