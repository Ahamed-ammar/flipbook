import api from './api'

export const annotationService = {
  // All annotations across books
  getAllAnnotations: async (params = {}) => {
    const res = await api.get('/annotations', { params })
    return res.data
  },

  // Book-specific annotations
  getBookAnnotations: async (bookId) => {
    const res = await api.get(`/books/${bookId}/annotations`)
    return res.data
  },

  // Highlights
  getHighlights: async (bookId) => {
    const res = await api.get(`/books/${bookId}/highlights`)
    return res.data
  },

  createHighlight: async (bookId, data) => {
    const res = await api.post(`/books/${bookId}/highlights`, data)
    return res.data
  },

  deleteHighlight: async (highlightId) => {
    await api.delete(`/highlights/${highlightId}`)
  },

  // Bookmarks
  getBookmarks: async (bookId) => {
    const res = await api.get(`/books/${bookId}/bookmarks`)
    return res.data
  },

  createBookmark: async (bookId, data) => {
    const res = await api.post(`/books/${bookId}/bookmarks`, data)
    return res.data
  },

  deleteBookmark: async (bookmarkId) => {
    await api.delete(`/bookmarks/${bookmarkId}`)
  },
}
