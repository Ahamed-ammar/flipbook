import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { annotationService } from '../services/annotationService'
import { useToastStore } from '../store/toastStore'
import { getErrorMessage } from '../services/api'

export function useAllAnnotations(params = {}) {
  return useQuery({
    queryKey: ['annotations', params],
    queryFn: () => annotationService.getAllAnnotations(params),
  })
}

export function useBookAnnotations(bookId) {
  return useQuery({
    queryKey: ['annotations', 'book', bookId],
    queryFn: () => annotationService.getBookAnnotations(bookId),
    enabled: !!bookId,
  })
}

export function useHighlights(bookId) {
  return useQuery({
    queryKey: ['highlights', bookId],
    queryFn: () => annotationService.getHighlights(bookId),
    enabled: !!bookId,
  })
}

export function useCreateHighlight(bookId) {
  const queryClient = useQueryClient()
  const toastError = useToastStore((s) => s.error)
  return useMutation({
    mutationFn: (data) => annotationService.createHighlight(bookId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights', bookId] })
      queryClient.invalidateQueries({ queryKey: ['annotations'] })
    },
    onError: (e) => toastError(getErrorMessage(e)),
  })
}

export function useDeleteHighlight(bookId) {
  const queryClient = useQueryClient()
  const toastError = useToastStore((s) => s.error)
  return useMutation({
    mutationFn: (highlightId) => annotationService.deleteHighlight(highlightId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights', bookId] })
      queryClient.invalidateQueries({ queryKey: ['annotations'] })
    },
    onError: (e) => toastError(getErrorMessage(e)),
  })
}

export function useBookmarks(bookId) {
  return useQuery({
    queryKey: ['bookmarks', bookId],
    queryFn: () => annotationService.getBookmarks(bookId),
    enabled: !!bookId,
  })
}

export function useCreateBookmark(bookId) {
  const queryClient = useQueryClient()
  const toastError = useToastStore((s) => s.error)
  return useMutation({
    mutationFn: (data) => annotationService.createBookmark(bookId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', bookId] })
      queryClient.invalidateQueries({ queryKey: ['annotations'] })
    },
    onError: (e) => toastError(getErrorMessage(e)),
  })
}

export function useDeleteBookmark(bookId) {
  const queryClient = useQueryClient()
  const toastError = useToastStore((s) => s.error)
  return useMutation({
    mutationFn: (bookmarkId) => annotationService.deleteBookmark(bookmarkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', bookId] })
      queryClient.invalidateQueries({ queryKey: ['annotations'] })
    },
    onError: (e) => toastError(getErrorMessage(e)),
  })
}

// Aliases used by Reader.jsx
export { useHighlights as useBookHighlights }
export { useBookmarks as useBookBookmarks }
