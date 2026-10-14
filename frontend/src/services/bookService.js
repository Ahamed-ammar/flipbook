import api from './api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export const bookService = {
  getHomeData: async () => {
    const res = await api.get('/home')
    return res.data
  },

  getBooks: async (params = {}) => {
    const res = await api.get('/books', { params })
    return res.data
  },

  getBook: async (bookId) => {
    const res = await api.get(`/books/${bookId}`)
    return res.data
  },

  uploadBook: async (formData, onProgress) => {
    const res = await api.post('/books', formData, {
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      },
    })
    return res.data
  },

  deleteBook: async (bookId) => {
    await api.delete(`/books/${bookId}`)
  },

  getPdfUrl: (bookId) => {
    const stored = localStorage.getItem('folio-auth')
    const token = stored ? JSON.parse(stored)?.state?.token : null
    return `${BASE_URL}/books/${bookId}/file?token=${token || ''}`
  },
}
