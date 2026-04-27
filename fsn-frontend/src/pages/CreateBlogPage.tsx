// ─────────────────────────────────────────────────────────────────────────────
// CreateBlogPage — Medium / LeetCode–style rich text editor
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import ImageExt from '@tiptap/extension-image'
import LinkExt from '@tiptap/extension-link'
import UnderlineExt from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useMutation } from '@tanstack/react-query'
import { blogApi } from '@/lib/api'
import type { CreateBlogPayload } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button, Input, Select } from '@/components/ui'
import { cn, getError } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

const lowlight = createLowlight(common)

const CATEGORIES = [
  { value: 'field_report', label: '📋 Field Report' },
  { value: 'innovation_story', label: '💡 Innovation Story' },
  { value: 'how_to', label: '📖 How-To Guide' },
  { value: 'research', label: '🔬 Research' },
  { value: 'opinion', label: '💬 Opinion' },
]

// ─── Toolbar Button ───────────────────────────────────────────────────────────
function ToolBtn({
  active, onClick, title, children, className,
}: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode; className?: string
}) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={cn(
        'p-2 rounded-lg text-sm transition-all hover:bg-ink-100',
        active ? 'bg-ink-900 text-white' : 'text-ink-500',
        className,
      )}>
      {children}
    </button>
  )
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const addImage = () => {
    const url = window.prompt('Image URL:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const addLink = () => {
    const url = window.prompt('Link URL:')
    if (url) editor.chain().focus().toggleLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-ink-100 bg-white sticky top-16 z-10 rounded-t-2xl">
      {/* Text type */}
      <div className="flex items-center border-r border-ink-100 pr-1 mr-1">
        <ToolBtn active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
          H1
        </ToolBtn>
        <ToolBtn active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          H2
        </ToolBtn>
        <ToolBtn active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
          H3
        </ToolBtn>
      </div>

      {/* Formatting */}
      <div className="flex items-center border-r border-ink-100 pr-1 mr-1">
        <ToolBtn active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
          <strong>B</strong>
        </ToolBtn>
        <ToolBtn active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
          <em>I</em>
        </ToolBtn>
        <ToolBtn active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
          <span className="underline">U</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <span className="line-through">S</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code">
          <span className="font-mono text-xs">{`<>`}</span>
        </ToolBtn>
      </div>

      {/* Blocks */}
      <div className="flex items-center border-r border-ink-100 pr-1 mr-1">
        <ToolBtn active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          •≡
        </ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
          1.
        </ToolBtn>
        <ToolBtn active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
          ❝
        </ToolBtn>
        <ToolBtn active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block">
          {'{ }'}
        </ToolBtn>
      </div>

      {/* Media */}
      <div className="flex items-center">
        <ToolBtn onClick={addImage} title="Insert Image">🖼️</ToolBtn>
        <ToolBtn active={editor.isActive('link')} onClick={addLink} title="Insert Link">🔗</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">—</ToolBtn>
      </div>

      {/* Undo/Redo */}
      <div className="ml-auto flex items-center gap-0.5">
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">↩</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Shift+Z)">↪</ToolBtn>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CreateBlogPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('field_report')
  const [coverImage, setCoverImage] = useState('')
  const [tags, setTags] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // use lowlight version
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder: 'Start writing your story…' }),
      ImageExt.configure({ HTMLAttributes: { class: 'rounded-xl max-w-full mx-auto my-4 border border-ink-100' } }),
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { class: 'text-fsn-700 underline hover:text-fsn-900' } }),
      UnderlineExt,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    editorProps: {
      attributes: {
        class: 'prose-fsn max-w-none focus:outline-none min-h-[400px] px-8 py-6',
      },
    },
  })

  // Convert TipTap JSON to backend content blocks
  const editorToBlocks = useCallback(() => {
    if (!editor) return []
    const json = editor.getJSON()
    const blocks: { type: string; data: Record<string, unknown> }[] = []

    json.content?.forEach(node => {
      switch (node.type) {
        case 'heading':
          blocks.push({ type: 'heading', data: { text: extractText(node), level: node.attrs?.level ?? 2 } })
          break
        case 'paragraph':
          blocks.push({ type: 'paragraph', data: { text: extractText(node) } })
          break
        case 'blockquote':
          blocks.push({ type: 'quote', data: { text: extractText(node) } })
          break
        case 'codeBlock':
          blocks.push({ type: 'code', data: { text: extractText(node), language: node.attrs?.language || '' } })
          break
        case 'image':
          blocks.push({ type: 'image', data: { url: node.attrs?.src, caption: node.attrs?.alt || '' } })
          break
        case 'bulletList':
        case 'orderedList':
          blocks.push({ type: 'paragraph', data: { text: extractText(node) } })
          break
        case 'horizontalRule':
          blocks.push({ type: 'divider', data: {} })
          break
      }
    })
    return blocks
  }, [editor])

  const publishMutation = useMutation({
    mutationFn: (payload: CreateBlogPayload) => blogApi.create(payload),
    onSuccess: () => {
      toast.success('Blog post published! 🎉')
      navigate('/blog')
    },
    onError: err => toast.error(getError(err)),
  })

  const handlePublish = (isDraft = false) => {
    if (!title.trim()) return toast.error('Please add a title')
    if (!editor || editor.isEmpty) return toast.error('Please write some content')

    const payload: CreateBlogPayload = {
      title: title.trim(),
      category,
      content: editorToBlocks(),
      coverImage: coverImage.trim() || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      isPublished: !isDraft,
    }
    publishMutation.mutate(payload)
  }

  // Word count
  const wordCount = editor?.getText().split(/\s+/).filter(Boolean).length ?? 0
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-ink-100 h-16">
        <div className="max-w-5xl mx-auto px-5 h-full flex items-center justify-between">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-ink-400 hover:text-ink-900 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-3 text-xs text-ink-300">
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{readTime} min read</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full"
              onClick={() => handlePublish(true)}
              loading={publishMutation.isPending}>
              Save Draft
            </Button>
            <Button variant="dark" size="sm" className="rounded-full"
              onClick={() => handlePublish(false)}
              loading={publishMutation.isPending}>
              Publish ✨
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        {/* Cover image preview */}
        {coverImage && (
          <div className="mb-6 aspect-video rounded-2xl overflow-hidden border border-ink-100 shadow-card">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" onError={() => setCoverImage('')} />
          </div>
        )}

        {/* Title — Medium-style large input */}
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full font-display text-4xl sm:text-5xl font-semibold text-ink-900 placeholder-ink-200 bg-transparent border-none outline-none mb-6 leading-tight"
        />

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-ink-100">
          <Select options={CATEGORIES} value={category}
            onChange={e => setCategory(e.target.value)} className="w-52" />
          <Input placeholder="Cover image URL" value={coverImage}
            onChange={e => setCoverImage(e.target.value)} className="flex-1 min-w-[200px]" />
          <Input placeholder="Tags (comma separated)" value={tags}
            onChange={e => setTags(e.target.value)} className="flex-1 min-w-[200px]" />
        </div>

        {/* Editor */}
        <div className="bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden">
          <EditorToolbar editor={editor} />

          {/* Bubble menu for inline formatting */}
          {editor && (
            <BubbleMenu editor={editor}
              className="flex items-center gap-0.5 bg-ink-900 text-white rounded-xl px-1.5 py-1 shadow-lg">
              <ToolBtn active={editor.isActive('bold')} className="!text-white hover:!bg-ink-700"
                onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
                <strong className="text-xs">B</strong>
              </ToolBtn>
              <ToolBtn active={editor.isActive('italic')} className="!text-white hover:!bg-ink-700"
                onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
                <em className="text-xs">I</em>
              </ToolBtn>
              <ToolBtn active={editor.isActive('underline')} className="!text-white hover:!bg-ink-700"
                onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
                <span className="text-xs underline">U</span>
              </ToolBtn>
              <ToolBtn active={editor.isActive('code')} className="!text-white hover:!bg-ink-700"
                onClick={() => editor.chain().focus().toggleCode().run()} title="Code">
                <span className="text-xs font-mono">{`<>`}</span>
              </ToolBtn>
              <ToolBtn active={editor.isActive('link')} className="!text-white hover:!bg-ink-700"
                onClick={() => {
                  const url = window.prompt('Link URL:')
                  if (url) editor.chain().focus().toggleLink({ href: url }).run()
                }} title="Link">
                <span className="text-xs">🔗</span>
              </ToolBtn>
            </BubbleMenu>
          )}

          <EditorContent editor={editor} />
        </div>

        {/* Writing tips */}
        <div className="mt-8 bg-white rounded-2xl border border-ink-100 p-6 shadow-card">
          <h3 className="font-display text-sm font-semibold text-ink-700 mb-3">✍️ Writing Tips</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-ink-400">
            <div className="flex items-start gap-2">
              <span className="text-ink-300 mt-0.5">⌘</span>
              <p><strong className="text-ink-600">Ctrl+B</strong> Bold, <strong className="text-ink-600">Ctrl+I</strong> Italic, <strong className="text-ink-600">Ctrl+U</strong> Underline</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-ink-300 mt-0.5">#</span>
              <p>Type <strong className="text-ink-600"># </strong> for H1, <strong className="text-ink-600">## </strong> for H2, <strong className="text-ink-600">### </strong> for H3</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-ink-300 mt-0.5">❝</span>
              <p>Type <strong className="text-ink-600">&gt; </strong> for blockquote</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-ink-300 mt-0.5">•</span>
              <p>Type <strong className="text-ink-600">- </strong> for bullet list, <strong className="text-ink-600">1. </strong> for numbered list</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-ink-300 mt-0.5">{'{ }'}</span>
              <p>Type <strong className="text-ink-600">``` </strong> for code block (with syntax highlighting)</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-ink-300 mt-0.5">✨</span>
              <p>Select text to see the <strong className="text-ink-600">floating toolbar</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractText(node: any): string {
  if (node.text) return node.text
  if (!node.content) return ''
  return node.content.map((c: any) => extractText(c)).join('')
}
