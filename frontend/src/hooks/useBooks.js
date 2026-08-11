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
  const toast = useToastStore()

  return useMutation({
    mutationFn: ({ formData, onProgress }) =>
      bookService.uploadBook(formData, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
      toast.success('Book added to your library')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()
  const toast = useToastStore()

  return useMutation({
    mutationFn: (bookId) => bookService.deleteBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
      toast.success('Book removed from library')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
