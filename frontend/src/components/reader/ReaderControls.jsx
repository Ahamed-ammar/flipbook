import { useReaderStore } from '../../store/readerStore'

const tones = [
  { key: 'cream', color: '#FAF6EE', label: 'Warm Archival Linen' },
  { key: 'ivory', color: '#FFFFFF', label: 'Cool Ivory Paper' },
  { key: 'sepia', color: '#F2E8DC', label: 'Deep Sepia' },
  { key: 'nocturne', color: '#24221F', label: 'Nocturne Reading' },
]

export default function ReaderControls({ bookTitle, onPrev, onNext }) {
  const {
    currentPage, totalPages, zoom, spreadMode,
    paperTone, fontSize,
    setZoom, setPaperTone, setFontSize, setSpreadMode,
  } = useReaderStore()

  const percentage = totalPages ? ((currentPage / totalPages) * 100).toFixed(1) : '0'

  return (
    <footer className="relative z-30 w-full px-4 pb-6 pt-2 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl shadow-xl p-3 sm:px-6 sm:py-3.5 flex flex-col space-y-3">

        {/* Navigation + scrubber */}
        <div className="flex items-center justify-between space-x-4">
          <button
            onClick={onPrev}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Previous pages"
          >
            <span className="material-symbols-outlined text-base">west</span>
            <span className="hidden sm:inline font-label-md text-label-md">
              {spreadMode ? `Page ${Math.max(1, currentPage - 2)}–${Math.max(1, currentPage - 1)}` : `Page ${Math.max(1, currentPage - 1)}`}
            </span>
          </button>

          {/* Slider */}
          <div className="flex-1 flex flex-col items-center space-y-1">
            <div className="w-full relative">
              <input
                className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                type="range"
                min="1"
                max={totalPages || 1}
                value={currentPage}
                onChange={(e) => useReaderStore.getState().setCurrentPage(Number(e.target.value))}
                aria-label="Page navigation"
              />
            </div>
            <div className="w-full flex justify-between font-label-sm text-label-sm text-outline px-1">
              <span>p. 1</span>
              <span className="font-medium text-primary">{bookTitle || 'Reading'}</span>
              <span>p. {totalPages}</span>
            </div>
          </div>

          <button
            onClick={onNext}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm"
            aria-label="Next pages"
          >
            <span className="hidden sm:inline font-label-md text-label-md">
              {spreadMode ? `Page ${currentPage + 2}–${currentPage + 3}` : `Page ${currentPage + 1}`}
            </span>
            <span className="material-symbols-outlined text-base">east</span>
          </button>
        </div>

        {/* Stats + appearance */}
        <div className="pt-2 flex items-center justify-between font-label-md text-label-md text-on-surface-variant flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-secondary font-medium">
              <span className="material-symbols-outlined text-sm">timelapse</span>
              <span>{percentage}% complete</span>
            </div>
            <span className="text-outline-variant">•</span>
            <span className="font-medium text-on-surface">p. {currentPage}/{totalPages}</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Paper tones */}
            <div className="flex items-center space-x-1 p-1 bg-surface-container rounded-lg">
              {tones.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setPaperTone(t.key)}
                  className={`w-5 h-5 rounded-full shadow-sm hover:scale-110 transition-transform ${paperTone === t.key ? 'ring-2 ring-primary' : ''}`}
                  style={{ backgroundColor: t.color }}
                  title={t.label}
                  aria-label={t.label}
                  aria-pressed={paperTone === t.key}
                />
              ))}
            </div>

            {/* Font size */}
            <div className="flex items-center space-x-1 bg-surface-container rounded-lg p-0.5">
              <button
                onClick={() => setFontSize(fontSize - 1)}
                className="px-2 py-1 rounded hover:bg-surface-container-lowest font-headline-sm text-sm"
                aria-label="Decrease font size"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize(fontSize + 1)}
                className="px-2 py-1 rounded hover:bg-surface-container-lowest font-headline-sm text-base font-semibold"
                aria-label="Increase font size"
              >
                A+
              </button>
            </div>

            {/* Spread toggle */}
            <div className="flex items-center bg-surface-container-lowest shadow-sm rounded-lg p-0.5">
              <button
                onClick={() => setSpreadMode(true)}
                className={`px-2.5 py-1 rounded text-label-md font-label-md flex items-center space-x-1 transition-colors ${
                  spreadMode ? 'bg-secondary-container text-on-secondary-fixed' : 'text-outline hover:text-on-surface'
                }`}
                aria-label="Two-page spread"
                aria-pressed={spreadMode}
              >
                <span className="material-symbols-outlined text-sm">menu_book</span>
                <span className="hidden sm:inline">Spread</span>
              </button>
              <button
                onClick={() => setSpreadMode(false)}
                className={`px-2.5 py-1 rounded text-label-md font-label-md flex items-center space-x-1 transition-colors ${
                  !spreadMode ? 'bg-secondary-container text-on-secondary-fixed' : 'text-outline hover:text-on-surface'
                }`}
                aria-label="Single page"
                aria-pressed={!spreadMode}
              >
                <span className="material-symbols-outlined text-sm">article</span>
                <span className="hidden sm:inline">Single</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
