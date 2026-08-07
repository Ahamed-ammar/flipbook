import { create } from 'zustand'

export const useReaderStore = create((set, get) => ({
  // Current state
  currentPage: 1,
  totalPages: 0,
  zoom: 1.0,
  spreadMode: true, // two-page on desktop
  paperTone: 'cream',
  fontSize: 18,
  isFullscreen: false,
  isBookmarked: false,
  showToolbar: true,
  isLoading: true,
  pdfDocument: null,
  highlightMode: false,
  selectedHighlightColor: '#facc15',

  // Actions
  setCurrentPage: (page) => {
    const { totalPages } = get()
    const clamped = Math.max(1, Math.min(page, totalPages))
    set({ currentPage: clamped })
  },

  setTotalPages: (n) => set({ totalPages: n }),

  setZoom: (zoom) => {
    const clamped = Math.min(1.5, Math.max(0.75, zoom))
    set({ zoom: clamped })
  },

  adjustZoom: (delta) => {
    const { zoom } = get()
    const clamped = Math.min(1.5, Math.max(0.75, zoom + delta))
    set({ zoom: clamped })
  },

  setSpreadMode: (mode) => set({ spreadMode: mode }),

  toggleSpreadMode: () => set((s) => ({ spreadMode: !s.spreadMode })),

  setPaperTone: (tone) => set({ paperTone: tone }),

  setFontSize: (size) => {
    const clamped = Math.min(22, Math.max(14, size))
    set({ fontSize: clamped })
  },

  setFullscreen: (val) => set({ isFullscreen: val }),

  setBookmarked: (val) => set({ isBookmarked: val }),

  setShowToolbar: (val) => set({ showToolbar: val }),

  setLoading: (val) => set({ isLoading: val }),

  setPdfDocument: (doc) => set({ pdfDocument: doc }),

  setHighlightMode: (val) => set({ highlightMode: val }),

  setHighlightColor: (color) => set({ selectedHighlightColor: color }),

  bookmarkedPages: [],
  setBookmarkedPages: (pages) => set({ bookmarkedPages: pages }),
  addBookmarkedPage: (page) => set((s) => ({ bookmarkedPages: [...new Set([...s.bookmarkedPages, page])] })),
  removeBookmarkedPage: (page) => set((s) => ({ bookmarkedPages: s.bookmarkedPages.filter((p) => p !== page) })),

  nextPage: () => {
    const { currentPage, totalPages, spreadMode } = get()
    const step = spreadMode ? 2 : 1
    const next = Math.min(currentPage + step, totalPages)
    set({ currentPage: next })
  },

  prevPage: () => {
    const { currentPage, spreadMode } = get()
    const step = spreadMode ? 2 : 1
    const prev = Math.max(1, currentPage - step)
    set({ currentPage: prev })
  },

  reset: () => set({
    currentPage: 1,
    totalPages: 0,
    zoom: 1.0,
    spreadMode: true,
    paperTone: 'cream',
    fontSize: 18,
    isFullscreen: false,
    isBookmarked: false,
    showToolbar: true,
    isLoading: true,
    pdfDocument: null,
    highlightMode: false,
    selectedHighlightColor: '#facc15',
  }),
}))
