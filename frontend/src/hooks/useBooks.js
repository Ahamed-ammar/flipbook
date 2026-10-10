import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookService } from '../services/bookService'
import { useToastStore } from '../store/toastStore'
import { getErrorMessage } from '../services/api'

export function useHomeData() {
  return useQuery({
    queryKey: ['home'],
    queryFn: bookService.getHomeData,
  })
}

export function useBooks(params = {}) {
  return useQuery({
    queryKey: ['books', params],
    queryFn: () => bookService.getBooks(params),
  })
}

export function useBook(bookId) {
  return useQuery({
    queryKey: ['book', bookId],
    queryFn: () => bookService.getBook(bookId),
    enabled: !!bookId,
  })
}

export function useUploadBook() {
  const queryClient = useQueryClient()
  const toastSuccess = useToastStore((s) => s.success)
  const toastError = useToastStore((s) => s.error)

  return useMutation({
    mutationFn: ({ formData, onProgress }) =>
      bookService.uploadBook(formData, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
      toastSuccess('Book added to your library')
    },
    onError: (error) => {
      toastError(getErrorMessage(error))
    },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()
  const toastSuccess = useToastStore((s) => s.success)
  const toastError = useToastStore((s) => s.error)

  return useMutation({
    mutationFn: (bookId) => bookService.deleteBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
      toastSuccess('Book removed from library')
    },
    onError: (error) => {
      toastError(getErrorMessage(error))
    },
  })
}
