import { useEffect, useRef, useState, memo } from 'react'

const PageRenderer = memo(function PageRenderer({ pdfDocument, pageNumber, scale = 1.0, paperTone = 'cream', highlights = [] }) {
  const canvasRef = useRef(null)
  const textLayerRef = useRef(null)
  const renderTaskRef = useRef(null)
  const [isRendering, setIsRendering] = useState(true)

  const toneColors = {
    cream: '#FAF6EE',
    ivory: '#FFFFFF',
    sepia: '#F2E8DC',
    nocturne: '#23211E',
  }

  useEffect(() => {
    if (!pdfDocument || !pageNumber) return

    let cancelled = false

    const render = async () => {
      setIsRendering(true)
      try {
        const page = await pdfDocument.getPage(pageNumber)
        if (cancelled) return

        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        if (!canvas) return

        const context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width

        // Set paper tone background
        context.fillStyle = toneColors[paperTone] || '#FAF6EE'
        context.fillRect(0, 0, canvas.width, canvas.height)

        // Cancel any existing render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel()
        }

        const renderTask = page.render({
          canvasContext: context,
          viewport,
          background: 'transparent',
        })
        renderTaskRef.current = renderTask

        await renderTask.promise
        if (cancelled) return
        setIsRendering(false)
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err)
        }
        if (!cancelled) setIsRendering(false)
      }
    }

    render()

    return () => {
      cancelled = true
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }
    }
  }, [pdfDocument, pageNumber, scale, paperTone])

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-surface-container-lowest/80">
          <div className="flex flex-col items-center gap-space-sm">
            <span className="material-symbols-outlined text-headline-lg text-primary animate-pulse">auto_stories</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Rendering page {pageNumber}...</span>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
        style={{ opacity: isRendering ? 0 : 1, transition: 'opacity 0.2s' }}
        aria-label={`Page ${pageNumber}`}
      />
      {/* Highlight overlays rendered on top */}
      {highlights.map((h) => h.positionData?.rects?.map((rect, ri) => (
        <div
          key={`${h.id}-${ri}`}
          className="pdf-highlight"
          style={{
            left: rect.x * scale,
            top: rect.y * scale,
            width: rect.width * scale,
            height: rect.height * scale,
            backgroundColor: h.color || '#facc15',
            opacity: 0.35,
          }}
        />
      )))}
    </div>
  )
})

export default PageRenderer
