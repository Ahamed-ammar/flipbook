import api from './api'

export const progressService = {
  getProgress: async (bookId) => {
    const res = await api.get(`/books/${bookId}/progress`)
    return res.data
  },

  saveProgress: async (bookId, currentPage) => {
    const res = await api.put(`/books/${bookId}/progress`, { currentPage })
    return res.data
  },
}
