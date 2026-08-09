import api from './api'

export const authService = {
  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    return res.data
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    return res.data
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore — always log out locally
    }
  },

  me: async () => {
    const res = await api.get('/auth/me')
    return res.data
  },
}
