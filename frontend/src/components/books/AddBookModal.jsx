import { useState, useRef, useCallback } from 'react'
import Modal from '../common/Modal'
import { useUploadBook } from '../../hooks/useBooks'

const STEPS = {
  DROP: 'drop',
  UPLOADING: 'uploading',
  DONE: 'done',
}

const MAX_SIZE_MB = 150
const ALLOWED_TYPES = ['application/pdf']

export function AddBookModal({ onClose }) {
  const [step, setStep] = useState(STEPS.DROP)
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [uploadSteps, setUploadSteps] = useState([
    { label: 'Binary payload uploaded safely', status: 'pending', detail: '' },
    { label: 'Metadata & chapters parsed', status: 'pending', detail: '' },
    { label: 'Extracting cover art', status: 'pending', detail: '' },
    { label: 'Generating reader cache', status: 'pending', detail: '' },
  ])
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const upload = useUploadBook()

  const validateFile = (f) => {
    if (!f) return 'No file selected'
    if (!ALLOWED_TYPES.includes(f.type)) return 'Only PDF files are supported'
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File must be under ${MAX_SIZE_MB}MB`
    return null
  }

  const handleFile = (f) => {
    const err = validateFile(f)
    if (err) { setError(err); return }
    setError('')
    setFile(f)
    // Pre-fill title from filename
    const baseName = f.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
    setTitle(baseName)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)

  const simulateStep = (idx, status, detail = '') => {
    setUploadSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, status, detail } : s))
    )
  }

  const handleUpload = async () => {
    if (!file) return
    setStep(STEPS.UPLOADING)
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    if (title) formData.append('title', title)
    if (author) formData.append('author', author)

    // Simulate step progression
    const stepTimer = (delay, fn) => new Promise((r) => setTimeout(() => { fn(); r() }, delay))

    try {
      simulateStep(0, 'active')
      await upload.mutateAsync({
        formData,
        onProgress: (p) => {
          setProgress(p)
          if (p >= 30) simulateStep(0, 'done', '100%')
          if (p >= 60) simulateStep(1, 'done', 'Verified')
          if (p >= 80) { simulateStep(2, 'active') }
          if (p >= 95) { simulateStep(2, 'done'); simulateStep(3, 'active') }
        },
      })
      await stepTimer(400, () => simulateStep(3, 'done'))
      setStep(STEPS.DONE)
      setTimeout(onClose, 1800)
    } catch {
      setStep(STEPS.DROP)
      setUploadSteps((prev) => prev.map((s) => ({ ...s, status: 'pending' })))
    }
  }

  const stepIcon = (status) => {
    if (status === 'done') return (
      <div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center shrink-0 mt-0.5">
        <span className="material-symbols-outlined text-ui-body-sm font-bold">check</span>
      </div>
    )
    if (status === 'active') return (
      <div className="w-5 h-5 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-primary" />
      </div>
    )
    return (
      <div className="w-5 h-5 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0 mt-0.5">
        <span className="material-symbols-outlined text-ui-body-sm">hourglass_empty</span>
      </div>
    )
  }

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div className="px-space-md sm:px-space-lg pt-space-lg pb-space-md flex items-start justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-label-sm font-label-sm tracking-wider uppercase">
              Folio Ingestion
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Add a new book</h1>
          <p className="font-reading-body-sm text-reading-body-sm text-on-surface-variant mt-1 max-w-xl">
            Upload your PDF. Folio parses metadata, reconstructs table of contents, and renders high-definition leaves.
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-headline-sm">close</span>
        </button>
      </div>

      {/* Body */}
      <div className="px-space-md sm:px-space-lg pb-space-lg grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left: Upload + progress */}
        <div className="lg:col-span-7 flex flex-col gap-space-md">
          {step === STEPS.DROP && (
            <>
              {/* Drop zone */}
              <div
                className={`relative rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-space-md cursor-pointer transition-all ${
                  dragOver
                    ? 'border-primary bg-primary-fixed/20'
                    : 'border-outline-variant bg-surface-container-low hover:bg-surface-container hover:border-primary'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label="Drop PDF file or click to browse"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-headline-md">upload_file</span>
                </div>
                <div className="text-center">
                  <p className="font-label-md text-label-md text-on-surface font-semibold">
                    {file ? file.name : 'Drop your PDF here'}
                  </p>
                  <p className="font-ui-body-sm text-ui-body-sm text-on-surface-variant mt-1">
                    {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `PDF files up to ${MAX_SIZE_MB}MB`}
                  </p>
                </div>
                {error && <p className="text-error font-ui-body-sm text-ui-body-sm">{error}</p>}
              </div>

              {/* Meta fields */}
              {file && (
                <div className="space-y-space-sm">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                      Title
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-2 rounded-lg font-ui-body-md text-ui-body-md text-on-surface outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Book title"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                      Author
                    </label>
                    <input
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-2 rounded-lg font-ui-body-md text-ui-body-md text-on-surface outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Author name (optional)"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {step === STEPS.UPLOADING && (
            <div className="rounded-xl bg-surface-container p-space-md shadow-sm">
              <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-headline-sm">menu_book</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-headline-sm text-headline-sm text-on-surface truncate">{title || file?.name}</p>
                    <p className="font-ui-body-sm text-ui-body-sm text-on-surface-variant">
                      {(file?.size / 1024 / 1024).toFixed(1)} MB PDF
                    </p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded-full">
                  {progress}%
                </span>
              </div>

              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden mb-space-md">
                <div
                  className="h-full bg-gradient-to-r from-primary-container via-primary to-surface-tint rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="space-y-space-sm bg-surface-container-lowest p-space-md rounded-lg">
                {uploadSteps.map((s, i) => (
                  <div key={i} className={`flex items-start gap-space-sm ${s.status === 'pending' ? 'opacity-50' : ''}`}>
                    {stepIcon(s.status)}
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <span className={`font-label-md text-label-md ${s.status === 'active' ? 'text-primary font-semibold' : 'text-on-surface'}`}>
                        {s.label}
                      </span>
                      {s.detail && (
                        <span className={`font-label-sm text-label-sm font-medium ${s.status === 'active' ? 'text-primary animate-pulse' : 'text-secondary'}`}>
                          {s.status === 'active' ? 'Active' : s.detail}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-space-sm flex items-center gap-space-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-ui-body-sm text-tertiary">auto_awesome</span>
                <p className="font-ui-body-sm text-ui-body-sm italic">Processing your manuscript...</p>
              </div>
            </div>
          )}

          {step === STEPS.DONE && (
            <div className="rounded-xl bg-secondary-container p-space-lg flex flex-col items-center gap-space-md text-center">
              <div className="w-16 h-16 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-headline-lg">done_all</span>
              </div>
              <div>
                <p className="font-headline-sm text-headline-sm text-on-surface">Book added successfully</p>
                <p className="font-ui-body-sm text-ui-body-sm text-on-secondary-container mt-1">
                  "{title}" is now in your library
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-surface-container-low p-space-md sm:p-space-lg rounded-xl">
          <div className="space-y-space-md">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Shelf Placement</h2>
              <span className="font-label-sm text-label-sm text-tertiary bg-surface-container px-2 py-0.5 rounded">
                Auto-Catalog
              </span>
            </div>

            {file ? (
              <div className="flex gap-space-md items-center p-space-sm bg-surface-container-lowest rounded-lg shadow-sm">
                <div className="w-16 aspect-[2/3] bg-primary-container text-on-primary-container rounded shadow-md overflow-hidden shrink-0 flex flex-col justify-between p-1.5">
                  <span className="font-label-sm text-[9px] uppercase tracking-wider opacity-80">PDF</span>
                  <span className="font-headline-sm text-[10px] leading-tight font-bold line-clamp-3">
                    {title || file.name}
                  </span>
                  <span className="font-label-sm text-[8px] opacity-90 truncate">{author}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Format</p>
                  <p className="font-headline-sm text-headline-sm text-on-surface truncate">Full Folio Spread</p>
                  <p className="font-ui-body-sm text-ui-body-sm text-on-surface-variant">Two-page archival layout</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-space-md items-center p-space-sm bg-surface-container rounded-lg">
                <div className="w-16 aspect-[2/3] bg-surface-container-high rounded shadow-inner flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant">library_books</span>
                </div>
                <p className="font-ui-body-sm text-ui-body-sm text-on-surface-variant italic">
                  Select a PDF to preview
                </p>
              </div>
            )}

            <div className="space-y-space-sm">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Catalog Title
                </label>
                <div className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg font-reading-body-sm text-reading-body-sm text-on-surface shadow-inner min-h-[36px]">
                  {title || <span className="text-on-surface-variant italic">Auto-detected from PDF</span>}
                </div>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Author
                </label>
                <div className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg font-ui-body-md text-ui-body-md text-on-surface shadow-inner min-h-[36px]">
                  {author || <span className="text-on-surface-variant italic">Auto-detected from PDF</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-space-md mt-space-md flex items-center justify-end gap-space-sm">
            <button
              onClick={onClose}
              className="px-space-md py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || step === STEPS.UPLOADING || step === STEPS.DONE}
              className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{step === STEPS.UPLOADING ? 'Processing...' : 'Start Reading Immediately'}</span>
              <span className="material-symbols-outlined text-ui-body-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-surface-container-high px-space-md sm:px-space-lg py-2.5 flex items-center justify-between text-on-surface-variant">
        <div className="flex items-center gap-space-xs font-ui-body-sm text-ui-body-sm">
          <span className="material-symbols-outlined text-label-md text-secondary">encrypted</span>
          <span>Encrypted storage • Files are private to your account</span>
        </div>
        <span className="font-label-sm text-label-sm">Folio PDF Engine</span>
      </div>
    </Modal>
  )
}

export default AddBookModal
