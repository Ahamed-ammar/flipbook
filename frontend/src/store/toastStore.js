import { create } from 'zustand'

let toastId = 0

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 3500) => {
    const id = ++toastId
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }))
    setTimeout(() => {
      get().removeToast(id)
    }, duration)
    return id
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  success: (message) => get().addToast(message, 'success'),
  error: (message) => get().addToast(message, 'error', 5000),
  info: (message) => get().addToast(message, 'info'),
}))
