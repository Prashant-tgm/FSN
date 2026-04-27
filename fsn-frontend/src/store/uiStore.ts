import { create } from 'zustand'

interface UIState {
  searchOpen: boolean
  notifPanelOpen: boolean
  sidebarOpen: boolean
  activeModal: string | null

  openSearch:       () => void
  closeSearch:      () => void
  toggleNotifs:     () => void
  closeNotifs:      () => void
  toggleSidebar:    () => void
  openModal:        (name: string) => void
  closeModal:       () => void
}

export const useUIStore = create<UIState>((set) => ({
  searchOpen: false, notifPanelOpen: false, sidebarOpen: false, activeModal: null,

  openSearch:    () => set({ searchOpen: true }),
  closeSearch:   () => set({ searchOpen: false }),
  toggleNotifs:  () => set((s) => ({ notifPanelOpen: !s.notifPanelOpen })),
  closeNotifs:   () => set({ notifPanelOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal:     (name) => set({ activeModal: name }),
  closeModal:    () => set({ activeModal: null }),
}))
