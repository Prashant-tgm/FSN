import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { getError } from '@/lib/utils'

export function useAuth() {
  const { user, isAuthenticated, setAuth, logout, openAuthModal } = useAuthStore()
  const navigate = useNavigate()

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ data }) => {
      if ((data.data as any).needsVerification) {
        toast.success('Registration successful! Please verify your email.')
        return
      }
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken)
      toast.success(`Welcome to FSN, ${data.data.user.fullName}!`)
    },
    onError: (err) => toast.error(getError(err)),
  })

  const verifyEmailMutation = useMutation({
    mutationFn: (b: { email: string; otp: string }) => authApi.verifyEmail(b.email, b.otp),
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken)
      toast.success('Email verified successfully!')
    },
    onError: (err) => toast.error(getError(err)),
  })

  const googleLoginMutation = useMutation({
    mutationFn: authApi.googleLogin,
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken)
      toast.success(`Welcome back, ${data.data.user.fullName}!`)
    },
    onError: (err) => toast.error(getError(err)),
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken)
      toast.success(`Welcome back, ${data.data.user.fullName}!`)
    },
    onError: (err) => toast.error(getError(err)),
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => { logout(); navigate('/'); toast.success('Signed out') },
  })

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) { openAuthModal('login'); return }
    action()
  }

  return {
    user, isAuthenticated,
    register:        registerMutation.mutate,
    login:           loginMutation.mutate,
    verifyEmail:     verifyEmailMutation.mutate,
    googleLogin:     googleLoginMutation.mutate,
    signOut:         logoutMutation.mutate,
    registerPending: registerMutation.isPending,
    loginPending:    loginMutation.isPending,
    verifyPending:   verifyEmailMutation.isPending,
    googlePending:   googleLoginMutation.isPending,
    requireAuth,
    openAuthModal,
  }
}
