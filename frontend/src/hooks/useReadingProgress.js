import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { progressService } from '../services/progressService'

export function useReadingProgress(bookId) {
  return useQuery({
    queryKey: ['progress', bookId],
    queryFn: () => progressService.getProgress(bookId),
    enabled: !!bookId,
    retry: false,
  })
}

export function useSaveProgress(bookId) {
  const queryClient = useQueryClient()
  const timerRef = useRef(null)

  const mutation = useMutation({
    mutationFn: (currentPage) => progressService.saveProgress(bookId, currentPage),
    onSuccess: (data) => {
      queryClient.setQueryData(['progress', bookId], data)
      queryClient.invalidateQueries({ queryKey: ['home'] })
    },
  })

  // Debounced save — only fires 1.5s after last page change
  const debouncedSave = useCallback(
    (page) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        mutation.mutate(page)
      }, 1500)
    },
    [mutation]
  )

  // Immediate save (on unmount / visibility change)
  const saveNow = useCallback(
    (page) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      mutation.mutate(page)
    },
    [mutation]
  )

  return { debouncedSave, saveNow, isSaving: mutation.isPending }
}
