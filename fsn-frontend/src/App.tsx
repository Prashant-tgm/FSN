import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// Layout
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SearchOverlay from '@/components/layout/SearchOverlay'
import RoleGuard from '@/components/layout/RoleGuard'

// Features
import AuthModal from '@/features/auth/AuthModal'
import NotificationPanel from '@/features/notifications/NotificationPanel'

// Pages
import LandingPage from '@/pages/LandingPage'
import {
  ProblemsPage,
  ProblemDetailPage,
  WallOfFamePage,
  BlogPage,
  BlogPostPage,
} from '@/pages/Pages'
import AdminDashboard from '@/pages/AdminDashboard'
import { ProfilePage, MyProblemsPage, MySolutionsPage } from '@/pages/ProfilePage'
import CreateBlogPage from '@/pages/CreateBlogPage'

// ─── Route guard ─────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

// ─── Shell layout ─────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-cream-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Global overlays — rendered outside the page scroll */}
      <SearchOverlay />
      <AuthModal />
      <NotificationPanel />
    </div>
  )
}

// ─── 404 ─────────────────────────────────────────────────────────────────────
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <p className="font-display text-[8rem] font-semibold text-ink-100 leading-none select-none">404</p>
      <h1 className="font-display text-3xl font-semibold text-ink-900 -mt-4 mb-3">Page not found</h1>
      <p className="text-sm text-ink-400 mb-8">The page you're looking for doesn't exist or has moved.</p>
      <a href="/" className="btn-dark px-8 py-3 rounded-full text-sm font-body font-medium inline-flex items-center gap-2">
        ← Back to Home
      </a>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Shell>
      <Routes>
        {/* Public */}
        <Route path="/"              element={<LandingPage />} />
        <Route path="/problems"      element={<ProblemsPage />} />
        <Route path="/problems/:id"  element={<ProblemDetailPage />} />
        <Route path="/wall-of-fame"  element={<WallOfFamePage />} />
        <Route path="/blog"          element={<BlogPage />} />
        <Route path="/blog/:slug"    element={<BlogPostPage />} />

        {/* Public profiles */}
        <Route path="/users/:id"     element={<ProfilePage />} />

        {/* Protected — any authenticated user */}
        <Route path="/my/problems" element={
          <ProtectedRoute><MyProblemsPage /></ProtectedRoute>
        } />
        <Route path="/my/solutions" element={
          <ProtectedRoute><MySolutionsPage /></ProtectedRoute>
        } />

        {/* Protected — role-gated */}
        <Route path="/blog/new" element={
          <ProtectedRoute>
            <RoleGuard allowed={['innovator', 'ngo', 'admin']}>
              <CreateBlogPage />
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute><AdminDashboard /></ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  )
}
