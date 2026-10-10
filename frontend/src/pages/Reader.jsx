import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import { useBook } from '../hooks/useBooks.js'
import { useReadingProgress, useSaveProgress } from '../hooks/useReadingProgress.js'
import { useBookHighlights, useBookBookmarks, useCreateHighlight, useCreateBookmark, useDeleteBookmark } from '../hooks/useAnnotations.js'
import { useReaderStore } from '../store/readerStore.js'
import { toast, ToastContainer } from '../components/common/Toast.jsx'
import { bookService } from '../services/bookService.js'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const PAPER_TONES = {
  cream:   { bg: '#FAF6EE', text: '#1D1B18' },
  ivory:   { bg: '#FFFFFF', text: '#1A1815' },
  sepia:   { bg: '#F2E8DC', text: '#2B2118' },
  nocturne:{ bg: '#23211E', text: '#E5DFD7' },
}

export default function Reader() {
  const { bookId }           = useParams()
  const [searchParams]       = useSearchParams()
  const navigate             = useNavigate()
  const targetPage           = parseInt(searchParams.get('page')) || null
  const targetHighlight      = searchParams.get('highlight') || null

  // ── Stores ──
  const {
    currentPage, setCurrentPage,
    totalPages,  setTotalPages,
    zoom,        adjustZoom,
    spreadMode,  toggleSpreadMode,
    isFullscreen, setFullscreen,
    paperTone,   setPaperTone,
    fontSize,    setFontSize,
    bookmarkedPages, setBookmarkedPages, addBookmarkedPage, removeBookmarkedPage,
    reset,
  } = useReaderStore()

  // ── Data ──
  const { data: book, isLoading: bookLoading } = useBook(bookId)
  const { data: progressData }                 = useReadingProgress(bookId)
  const { debouncedSave, saveNow }             = useSaveProgress(bookId)
  const { data: highlights = [] }              = useBookHighlights(bookId)
  const { data: bookmarks = [] }               = useBookBookmarks(bookId)
  const { mutate: createHighlight }            = useCreateHighlight(bookId)
  const { mutate: createBookmark }             = useCreateBookmark(bookId)
  const { mutate: deleteBookmark }             = useDeleteBookmark(bookId)

  // ── PDF state ──
  const [pdfDoc, setPdfDoc]         = useState(null)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [pdfError, setPdfError]     = useState(null)
  const [flipDir, setFlipDir]       = useState(null) // 'forward' | 'backward' | null

  // ── Highlight tool state ──
  const [showHighlightToolbar, setShowHighlightToolbar] = useState(false)
  const [selectionData, setSelectionData]               = useState(null)
  const [toolbarPos, setToolbarPos]                     = useState({ x: 0, y: 0 })

  // ── Canvas refs ──
  const leftCanvasRef  = useRef(null)
  const rightCanvasRef = useRef(null)
  const renderTasksRef = useRef({})
  const progressInitRef= useRef(false)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // ── Paper tone styles ──
  const tone = PAPER_TONES[paperTone] || PAPER_TONES.cream

  // ── Load PDF ──
  useEffect(() => {
    if (!bookId) return
    reset()
    setPdfLoading(true)
    setPdfError(null)

    const url = bookService.getPdfUrl(bookId)
    pdfjsLib.getDocument({
      url,
      withCredentials: false,
    }).promise.then((doc) => {
      setPdfDoc(doc)
      setTotalPages(doc.numPages)
      setPdfLoading(false)
    }).catch((err) => {
      console.error('PDF load error:', err)
      setPdfError('Failed to load PDF. Please try again.')
      setPdfLoading(false)
    })

    return () => { setPdfDoc(null) }
  }, [bookId, reset, setTotalPages])

  // ── Restore reading progress once PDF + progress data are ready ──
  useEffect(() => {
    if (progressInitRef.current) return
    if (!pdfDoc || !totalPages) return

    let page = 1
    if (targetPage) {
      page = Math.min(Math.max(1, targetPage), totalPages)
    } else if (progressData?.currentPage) {
      page = Math.min(progressData.currentPage, totalPages)
    }
    setCurrentPage(page)
    progressInitRef.current = true
  }, [pdfDoc, totalPages, progressData, targetPage, setCurrentPage])

  // ── Sync bookmarks from API ──
  useEffect(() => {
    if (bookmarks.length > 0) {
      setBookmarkedPages(bookmarks.map((b) => b.pageNumber))
    }
  }, [bookmarks, setBookmarkedPages])

  // ── Render pages whenever currentPage, pdfDoc, zoom, or spread mode changes ──
  useEffect(() => {
    if (!pdfDoc || !totalPages || !currentPage) return

    const leftPage  = currentPage
    const rightPage = spreadMode && !isMobile ? currentPage + 1 : null

    renderPage(leftPage,  leftCanvasRef.current)
    if (rightPage && rightPage <= totalPages) {
      renderPage(rightPage, rightCanvasRef.current)
    } else if (rightCanvasRef.current) {
      const ctx = rightCanvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, rightCanvasRef.current.width, rightCanvasRef.current.height)
    }
  }, [pdfDoc, currentPage, zoom, spreadMode, totalPages, isMobile]) // eslint-disable-line

  async function renderPage(pageNum, canvas) {
    if (!canvas || !pdfDoc) return
    // Cancel any pending render on this canvas
    const key = canvas === leftCanvasRef.current ? 'left' : 'right'
    if (renderTasksRef.current[key]) {
      try { renderTasksRef.current[key].cancel() } catch {}
    }

    try {
      const page     = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: zoom * 1.5 })
      canvas.height  = viewport.height
      canvas.width   = viewport.width

      const ctx = canvas.getContext('2d')
      const task = page.render({ canvasContext: ctx, viewport })
      renderTasksRef.current[key] = task
      await task.promise
      delete renderTasksRef.current[key]
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Render error:', err)
      }
    }
  }

  // ── Navigation ──
  function goNext() {
    const step = spreadMode && !isMobile ? 2 : 1
    const next = Math.min(totalPages, currentPage + step)
    if (next === currentPage) return
    setFlipDir('forward')
    setTimeout(() => {
      setCurrentPage(next)
      debouncedSave(next)
      setFlipDir(null)
    }, 480)
  }

  function goPrev() {
    const step = spreadMode && !isMobile ? 2 : 1
    const prev = Math.max(1, currentPage - step)
    if (prev === currentPage) return
    setFlipDir('backward')
    setTimeout(() => {
      setCurrentPage(prev)
      debouncedSave(prev)
      setFlipDir(null)
    }, 480)
  }

  function goToPage(page) {
    const clamped = Math.min(Math.max(1, page), totalPages)
    setCurrentPage(clamped)
    debouncedSave(clamped)
    setFlipDir(null)
  }

  // ── Keyboard navigation ──
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT') return
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); goPrev() }
      else if (e.key === '+' || e.key === '=') adjustZoom(0.1)
      else if (e.key === '-')          adjustZoom(-0.1)
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      else if (e.key === 'Escape') {
        if (isFullscreen) exitFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentPage, totalPages, zoom, isFullscreen, spreadMode]) // eslint-disable-line

  // ── Fullscreen ──
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setFullscreen(true)
    } else {
      exitFullscreen()
    }
  }
  function exitFullscreen() {
    document.exitFullscreen().catch(() => {})
    setFullscreen(false)
  }
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [setFullscreen])

  // ── Touch swipe ──
  const touchStartX = useRef(null)
  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev() }
    touchStartX.current = null
  }

  // ── Highlight selection ──
  function onMouseUp(e) {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) {
      setShowHighlightToolbar(false)
      setSelectionData(null)
      return
    }
    const text = sel.toString().trim()
    if (!text) { setShowHighlightToolbar(false); return }

    const range  = sel.getRangeAt(0)
    const rect   = range.getBoundingClientRect()
    setToolbarPos({ x: rect.left + rect.width / 2, y: rect.top - 12 })
    setSelectionData({ text, range })
    setShowHighlightToolbar(true)
  }

  function saveHighlight(color) {
    if (!selectionData) return
    createHighlight({
      pageNumber:   currentPage,
      selectedText: selectionData.text,
      color,
      positionData: JSON.stringify({}),
    }, {
      onSuccess: () => toast.success('Highlight saved.'),
      onError:   () => toast.error('Failed to save highlight.'),
    })
    window.getSelection()?.removeAllRanges()
    setShowHighlightToolbar(false)
    setSelectionData(null)
  }

  // ── Bookmark toggle ──
  function toggleBookmark() {
    const isBookmarked = bookmarks.some((b) => b.pageNumber === currentPage)
    if (isBookmarked) {
      const bm = bookmarks.find((b) => b.pageNumber === currentPage)
      if (bm) {
        deleteBookmark(bm.id, {
          onSuccess: () => {
            removeBookmarkedPage(currentPage)
            toast.info(`Bookmark removed from page ${currentPage}.`)
          },
        })
      }
    } else {
      createBookmark({ pageNumber: currentPage, label: '' }, {
        onSuccess: () => {
          addBookmarkedPage(currentPage)
          toast.success(`Page ${currentPage} bookmarked.`)
        },
        onError: () => toast.error('Failed to create bookmark.'),
      })
    }
  }

  const isCurrentPageBookmarked = bookmarks.some((b) => b.pageNumber === currentPage)
  const pct = totalPages ? Math.round((currentPage / totalPages) * 100 * 10) / 10 : 0

  // ── Render page numbers in spread display ──
  const leftPageNum  = currentPage
  const rightPageNum = spreadMode && !isMobile ? currentPage + 1 : null

  if (pdfLoading || bookLoading) return <ReaderSkeleton />

  if (pdfError) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-[var(--color-error)] mb-4 block" style={{ fontSize: 48 }}>error</span>
          <h2 className="text-headline-sm text-[var(--color-on-surface)] mb-2">Failed to load book</h2>
          <p className="text-ui-body-sm text-[var(--color-on-surface-variant)] mb-6">{pdfError}</p>
          <button onClick={() => navigate('/library')} className="px-4 py-2 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-lg text-label-md">
            Back to Library
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="bg-[var(--color-surface)] font-geist text-[var(--color-on-surface)] min-h-screen flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <ToastContainer />

      {/* ── Ambient light scatter ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-gradient-to-b from-[var(--color-primary-fixed)]/30 via-[var(--color-tertiary-fixed)]/15 to-transparent blur-3xl opacity-60" />
      </div>

      {/* ── Top header / dock ── */}
      <header className="relative z-30 w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-outline-variant)]/30">
        {/* Back + book identity */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={() => { saveNow(currentPage); navigate('/library') }}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-container-lowest)] shadow-sm hover:bg-[var(--color-surface-container)] transition-all shrink-0"
            aria-label="Back to library"
          >
            <span className="material-symbols-outlined text-[var(--color-primary)] transition-transform group-hover:-translate-x-0.5" style={{ fontSize: 18 }}>arrow_back</span>
            <span className="text-label-md text-[var(--color-on-surface)] hidden sm:inline">Library</span>
          </button>

          <span className="text-[var(--color-outline-variant)] text-label-sm hidden sm:inline">/</span>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] min-w-0">
            <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontSize: 16 }}>auto_stories</span>
            <span className="text-label-md font-medium text-[var(--color-on-surface)] truncate max-w-[160px]">{book?.title}</span>
            <span className="text-[var(--color-outline-variant)] hidden lg:inline">•</span>
            <span className="text-label-sm text-[var(--color-outline)] truncate hidden lg:inline">{book?.author}</span>
          </div>
        </div>

        {/* Center context pill */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-surface-container-lowest)] shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
          <span className="text-label-md text-[var(--color-on-surface)]">
            {spreadMode && !isMobile
              ? `pp. ${leftPageNum}–${Math.min(rightPageNum ?? leftPageNum, totalPages)} of ${totalPages}`
              : `p. ${leftPageNum} of ${totalPages}`
            }
          </span>
        </div>

        {/* Right toolbar */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {/* Bookmark */}
          <button
            onClick={toggleBookmark}
            className={`p-2 rounded-lg bg-[var(--color-surface-container-lowest)] shadow-sm hover:bg-[var(--color-surface-container)] transition-all ${
              isCurrentPageBookmarked ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
            }`}
            aria-label={isCurrentPageBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, fontVariationSettings: isCurrentPageBookmarked ? "'FILL' 1" : "'FILL' 0" }}
            >
              bookmark
            </span>
          </button>

          {/* Spread mode toggle */}
          <div className="hidden md:flex items-center bg-[var(--color-surface-container-lowest)] shadow-sm rounded-lg p-0.5">
            <button
              onClick={() => { if (!spreadMode) toggleSpreadMode() }}
              className={`px-2.5 py-1 rounded text-label-md flex items-center gap-1 transition-colors ${
                spreadMode ? 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-fixed)]' : 'text-[var(--color-outline)] hover:text-[var(--color-on-surface)]'
              }`}
              aria-label="Two-page spread"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
              <span className="hidden lg:inline">Spread</span>
            </button>
            <button
              onClick={() => { if (spreadMode) toggleSpreadMode() }}
              className={`px-2.5 py-1 rounded text-label-md flex items-center gap-1 transition-colors ${
                !spreadMode ? 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-fixed)]' : 'text-[var(--color-outline)] hover:text-[var(--color-on-surface)]'
              }`}
              aria-label="Single page"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>article</span>
              <span className="hidden lg:inline">Single</span>
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center bg-[var(--color-surface-container-lowest)] shadow-sm rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => adjustZoom(-0.1)}
              className="p-1.5 rounded hover:bg-[var(--color-surface-container)] text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors"
              aria-label="Zoom out"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>zoom_out</span>
            </button>
            <span className="text-label-sm text-[var(--color-on-surface)] px-1 min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => adjustZoom(0.1)}
              className="p-1.5 rounded hover:bg-[var(--color-surface-container)] text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors"
              aria-label="Zoom in"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>zoom_in</span>
            </button>
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[var(--color-surface-container-lowest)] shadow-sm hover:bg-[var(--color-surface-container)] text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-all"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
        </div>
      </header>

      {/* ── Keyboard hint ── */}
      <div className="relative z-10 w-full flex justify-center py-2">
        <div className="hidden md:flex items-center gap-2 text-[var(--color-outline)] text-label-sm bg-[var(--color-surface-container-low)]/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>keyboard</span>
          <span>Turn with</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-container-lowest)] font-semibold text-[var(--color-on-surface)] text-label-sm">←</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-container-lowest)] font-semibold text-[var(--color-on-surface)] text-label-sm">→</kbd>
          <span>or</span>
          <kbd className="px-2 py-0.5 rounded bg-[var(--color-surface-container-lowest)] font-semibold text-[var(--color-on-surface)] text-label-sm">Space</kbd>
        </div>
      </div>

      {/* ── Book stage / reading canvas ── */}
      <main
        className="relative z-10 flex-1 w-full px-2 md:px-6 lg:px-12 flex justify-center items-start py-2 md:py-4"
        onMouseUp={onMouseUp}
      >
        <div
          className="relative w-full max-w-[1240px] transition-transform duration-300"
          style={{ perspective: '2400px' }}
        >
          {/* Page edge shimming — physical book depth illusion */}
          <div className="absolute -left-3 top-3 bottom-3 w-4 bg-[var(--color-surface-container-highest)] rounded-l-md shadow-md -z-10 transform -skew-y-1" />
          <div className="absolute -left-1.5 top-1.5 bottom-1.5 w-3 bg-[var(--color-surface-container)] rounded-l shadow-sm -z-10" />
          <div className="absolute -right-3 top-3 bottom-3 w-4 bg-[var(--color-surface-container-highest)] rounded-r-md shadow-md -z-10 transform skew-y-1" />
          <div className="absolute -right-1.5 top-1.5 bottom-1.5 w-3 bg-[var(--color-surface-container)] rounded-r shadow-sm -z-10" />

          {/* Book block surface */}
          <div
            className={`relative flex flex-col md:flex-row bg-[var(--color-surface-container-lowest)] rounded-xl shadow-2xl overflow-hidden min-h-[500px] md:min-h-[680px] ${
              flipDir === 'forward'  ? 'page-flip-forward'  :
              flipDir === 'backward' ? 'page-flip-backward' : ''
            }`}
          >
            {/* ── LEFT PAGE ── */}
            <article
              className="relative flex-1 flex flex-col justify-between select-text cursor-default overflow-hidden"
              style={{ backgroundColor: tone.bg, color: tone.text }}
            >
              {/* Ambient gradient */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/[0.02] via-transparent to-black/[0.04]" />

              {/* Running header */}
              <header className="flex items-center justify-between px-6 md:px-12 lg:px-16 pt-8 pb-4 text-label-sm tracking-widest uppercase opacity-60" style={{ color: tone.text }}>
                <span>{book?.title}</span>
                {spreadMode && !isMobile && <span className="opacity-40">Section · Page {leftPageNum}</span>}
              </header>

              {/* Canvas */}
              <div className="flex-1 flex items-center justify-center px-4 md:px-8 py-4 overflow-auto">
                <canvas
                  ref={leftCanvasRef}
                  className="max-w-full max-h-full object-contain shadow-sm"
                  style={{ borderRadius: 2 }}
                />
              </div>

              {/* Running footer */}
              <footer className="flex items-center justify-between px-6 md:px-12 lg:px-16 pb-8 pt-4 text-label-sm opacity-60" style={{ color: tone.text }}>
                <span className="text-reading-body-sm font-medium" style={{ fontFamily: 'var(--font-family-literata)' }}>{leftPageNum}</span>
                <span className="opacity-50">{book?.author}</span>
              </footer>
            </article>

            {/* ── BINDING SPINE ── */}
            {spreadMode && !isMobile && (
              <div className="relative w-8 flex-shrink-0 bg-gradient-to-r from-black/10 via-black/25 to-black/10 flex items-center justify-center pointer-events-none shadow-inner z-20">
                <div className="flex flex-col gap-16 opacity-30">
                  {[0,1,2,3,4].map((i) => (
                    <span key={i} className="w-1.5 h-3 border-y border-[var(--color-outline-variant)]" />
                  ))}
                </div>
              </div>
            )}

            {/* ── RIGHT PAGE ── */}
            {spreadMode && !isMobile && (
              <article
                className="relative flex-1 flex flex-col justify-between select-text cursor-default overflow-hidden"
                style={{ backgroundColor: tone.bg, color: tone.text }}
              >
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-l from-black/[0.03] via-transparent to-black/[0.02]" />

                {/* Running header */}
                <header className="flex items-center justify-between px-6 md:px-12 lg:px-16 pt-8 pb-4 text-label-sm tracking-widest uppercase opacity-60" style={{ color: tone.text }}>
                  <span className="opacity-40">{book?.title}</span>
                  <span>{book?.author}</span>
                </header>

                {/* Canvas */}
                <div className="flex-1 flex items-center justify-center px-4 md:px-8 py-4 overflow-auto">
                  <canvas
                    ref={rightCanvasRef}
                    className="max-w-full max-h-full object-contain shadow-sm"
                    style={{ borderRadius: 2 }}
                  />
                </div>

                {/* Running footer */}
                <footer className="flex items-center justify-between px-6 md:px-12 lg:px-16 pb-8 pt-4 text-label-sm opacity-60" style={{ color: tone.text }}>
                  <span className="opacity-50">{book?.title}</span>
                  <span className="text-reading-body-sm font-medium" style={{ fontFamily: 'var(--font-family-literata)' }}>
                    {rightPageNum && rightPageNum <= totalPages ? rightPageNum : ''}
                  </span>
                </footer>

                {/* Page curl / next trigger */}
                {rightPageNum && rightPageNum < totalPages && (
                  <div
                    className="group absolute bottom-0 right-0 w-28 h-28 cursor-pointer z-30 flex items-end justify-end p-3"
                    onClick={goNext}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && goNext()}
                    aria-label="Next pages"
                  >
                    <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-[var(--color-surface-dim)] via-[var(--color-surface-container-high)] to-transparent rounded-tl-3xl opacity-75 group-hover:w-24 group-hover:h-24 group-hover:opacity-100 transition-all duration-300 shadow-md" />
                    <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-[var(--color-surface-container-lowest)] to-[var(--color-surface-bright)] rounded-tl-2xl shadow-sm transform group-hover:scale-110 transition-transform" />
                    <div className="relative z-40 flex items-center gap-1 text-[var(--color-primary)] opacity-80 group-hover:opacity-100 transform group-hover:-translate-x-1 group-hover:-translate-y-1 transition-all">
                      <span className="text-label-sm font-bold">{rightPageNum + 1}</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                    </div>
                  </div>
                )}
              </article>
            )}
          </div>
        </div>
      </main>

      {/* ── Floating side tools ── */}
      <aside className="fixed right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 z-30">
        <ToolButton
          icon="ink_highlighter"
          title="Highlight selection"
          bg="hover:bg-[var(--color-tertiary-fixed)]"
          color="text-[var(--color-tertiary)]"
          onClick={() => {}}
        />
        <ToolButton
          icon="collections_bookmark"
          title="Bookmark this page"
          bg={isCurrentPageBookmarked ? 'bg-[var(--color-secondary-container)]' : 'hover:bg-[var(--color-secondary-container)]'}
          color="text-[var(--color-secondary)]"
          onClick={toggleBookmark}
        />
        <ToolButton
          icon="stylus_note"
          title="Annotations"
          bg="hover:bg-[var(--color-primary-fixed)]"
          color="text-[var(--color-primary)]"
          onClick={() => navigate('/annotations')}
        />
      </aside>

      {/* ── Bottom control island ── */}
      <footer className="relative z-30 w-full px-4 pb-4 pt-2 flex flex-col items-center">
        <div className="w-full max-w-3xl bg-[var(--color-surface-container-lowest)]/95 backdrop-blur-md rounded-2xl shadow-xl p-3 sm:px-6 sm:py-3.5 flex flex-col gap-3">

          {/* Prev / scrubber / next */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={goPrev}
              disabled={currentPage <= 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors disabled:opacity-30 shrink-0"
              aria-label="Previous pages"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>west</span>
              <span className="hidden sm:inline text-label-md">
                {spreadMode && !isMobile ? `p. ${Math.max(1, currentPage - 2)}–${Math.max(1, currentPage - 1)}` : `p. ${Math.max(1, currentPage - 1)}`}
              </span>
            </button>

            {/* Progress scrubber */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <input
                type="range"
                min={1}
                max={totalPages || 1}
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: 'var(--color-primary)' }}
                aria-label="Page scrubber"
              />
              <div className="w-full flex justify-between text-label-sm text-[var(--color-outline)] px-1">
                <span>p. 1</span>
                <span className="font-medium text-[var(--color-primary)]">
                  {pct}% complete
                </span>
                <span>p. {totalPages}</span>
              </div>
            </div>

            <button
              onClick={goNext}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-container)] transition-colors shadow-sm disabled:opacity-30 shrink-0"
              aria-label="Next pages"
            >
              <span className="hidden sm:inline text-label-md">
                {spreadMode && !isMobile
                  ? `p. ${Math.min(totalPages, currentPage + 2)}–${Math.min(totalPages, currentPage + 3)}`
                  : `p. ${Math.min(totalPages, currentPage + 1)}`
                }
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>east</span>
            </button>
          </div>

          {/* Lower strip: meta + appearance */}
          <div className="pt-1 flex items-center justify-between flex-wrap gap-2 text-label-md text-[var(--color-on-surface-variant)]">
            {/* Reading stats */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[var(--color-secondary)] font-medium">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>timelapse</span>
                <span className="text-label-sm">p. {currentPage}/{totalPages}</span>
              </div>
              <span className="text-[var(--color-outline-variant)]">•</span>
              <span className="text-label-sm font-medium text-[var(--color-on-surface)]">{pct}% complete</span>
            </div>

            {/* Appearance controls */}
            <div className="flex items-center gap-2">
              {/* Paper tone swatches */}
              <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-container)] rounded-lg">
                {Object.entries(PAPER_TONES).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setPaperTone(key)}
                    className={`w-5 h-5 rounded-full shadow-sm hover:scale-110 transition-transform ${paperTone === key ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
                    style={{ backgroundColor: val.bg }}
                    title={`${key} tone`}
                    aria-label={`${key} paper tone`}
                  />
                ))}
              </div>

              {/* Font size */}
              <div className="flex items-center gap-0.5 bg-[var(--color-surface-container)] rounded-lg p-0.5">
                <button
                  onClick={() => adjustFontSize(-1)}
                  className="px-2 py-1 rounded hover:bg-[var(--color-surface-container-lowest)] text-sm"
                  aria-label="Decrease font size"
                  style={{ fontFamily: 'var(--font-family-literata)' }}
                >
                  A-
                </button>
                <button
                  onClick={() => adjustFontSize(1)}
                  className="px-2 py-1 rounded hover:bg-[var(--color-surface-container-lowest)] text-base font-semibold"
                  aria-label="Increase font size"
                  style={{ fontFamily: 'var(--font-family-literata)' }}
                >
                  A+
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Highlight selection toolbar ── */}
      {showHighlightToolbar && (
        <HighlightToolbar
          position={toolbarPos}
          onSave={saveHighlight}
          onDismiss={() => { setShowHighlightToolbar(false); window.getSelection()?.removeAllRanges() }}
        />
      )}
    </div>
  )
}

// ── Sub-components ──

function ToolButton({ icon, title, bg, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`p-2.5 rounded-full bg-[var(--color-surface-container-lowest)] shadow-md ${bg} ${color} transition-transform hover:scale-110`}
      title={title}
      aria-label={title}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
    </button>
  )
}

function HighlightToolbar({ position, onSave, onDismiss }) {
  const COLORS = [
    { key: 'yellow', hex: '#facc15', label: 'Yellow' },
    { key: 'blue',   hex: '#38bdf8', label: 'Blue'   },
    { key: 'green',  hex: '#4ade80', label: 'Green'  },
    { key: 'pink',   hex: '#f472b6', label: 'Pink'   },
  ]

  return (
    <div
      className="fixed z-50 flex items-center gap-1.5 bg-[var(--color-surface-container-lowest)] rounded-full shadow-xl px-3 py-2 border border-[var(--color-outline-variant)]"
      style={{ left: Math.min(position.x, window.innerWidth - 200), top: Math.max(8, position.y - 56) }}
    >
      <span className="text-label-sm text-[var(--color-on-surface-variant)] mr-1">Highlight:</span>
      {COLORS.map(({ key, hex, label }) => (
        <button
          key={key}
          onClick={() => onSave(key)}
          className="w-6 h-6 rounded-full hover:scale-125 transition-transform shadow-sm"
          style={{ backgroundColor: hex }}
          title={label}
          aria-label={`Highlight in ${label}`}
        />
      ))}
      <button
        onClick={onDismiss}
        className="ml-1 p-0.5 rounded text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
      </button>
    </div>
  )
}

function ReaderSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col">
      <div className="h-16 bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)]/30 flex items-center px-6 gap-4">
        <div className="skeleton h-8 w-24 rounded-lg" />
        <div className="skeleton h-6 w-48 rounded-lg hidden md:block" />
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          <div className="flex gap-2 rounded-xl overflow-hidden shadow-2xl min-h-[600px]">
            <div className="skeleton flex-1" />
            <div className="w-8 bg-[var(--color-surface-container-high)]" />
            <div className="skeleton flex-1" />
          </div>
        </div>
      </div>
      <div className="h-20 bg-[var(--color-surface-container-low)] flex items-center justify-center px-6">
        <div className="skeleton h-12 w-full max-w-3xl rounded-2xl" />
      </div>
    </div>
  )
}
