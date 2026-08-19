import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import AddBookModal from '../books/AddBookModal'

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [showAddBook, setShowAddBook] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    await authService.logout()
    logout()
    navigate('/login')
  }

  const navLinks = [
    { path: '/home', label: 'Home', icon: 'home' },
    { path: '/library', label: 'Library', icon: 'local_library' },
    { path: '/annotations', label: 'Annotations', icon: 'edit_note' },
  ]

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 w-full px-margin-mobile md:px-margin lg:px-margin-desktop flex items-center justify-between gap-gutter">

          {/* Logo + Nav */}
          <div className="flex items-center gap-space-lg shrink-0">
            <Link to="/home" className="flex items-center gap-space-sm">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}
              >
                auto_stories
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Folio</span>
            </Link>
            <nav className="hidden md:flex items-center gap-space-xs" aria-label="Main navigation">
              {navLinks.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-space-sm py-space-xs rounded-lg font-label-md text-label-md transition-colors ${
                    isActive(path)
                      ? 'bg-surface-container text-on-surface'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                  aria-current={isActive(path) ? 'page' : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-space-sm text-on-surface-variant pointer-events-none" style={{ fontSize: 18 }}>
                search
              </span>
              <input
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant placeholder:italic pl-10 pr-12 py-space-xs rounded-lg font-ui-body-sm text-ui-body-sm outline-none focus:ring-1 focus:ring-primary transition-all shadow-[0_1px_3px_rgba(28,26,23,0.03)]"
                placeholder="Search your library..."
                type="search"
                aria-label="Search library"
              />
              <kbd className="absolute right-space-sm font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-space-sm shrink-0">
            <button
              onClick={() => setShowAddBook(true)}
              className="flex items-center gap-space-xs bg-primary-container hover:bg-primary text-on-primary-container px-space-sm md:px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              <span className="hidden sm:inline">Add Book</span>
            </button>

            <button
              aria-label="Toggle theme"
              className="p-space-xs rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-headline-sm">dark_mode</span>
            </button>

            {/* User avatar */}
            <div className="relative pl-space-xs">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-md text-label-md font-semibold uppercase"
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                {user?.name?.[0] || 'U'}
              </button>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-xl p-space-xs z-50 animate-fade-in">
                    <div className="px-space-sm py-space-xs text-on-surface-variant font-label-sm text-label-sm border-b border-outline-variant mb-1">
                      {user?.name || 'Reader'}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-space-sm py-space-xs rounded-lg hover:bg-surface-container font-label-md text-label-md text-on-surface transition-colors flex items-center gap-space-xs"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-outline-variant z-50 flex" aria-label="Mobile navigation">
          {navLinks.map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 font-label-sm text-label-sm transition-colors ${
                isActive(path) ? 'text-primary' : 'text-on-surface-variant'
              }`}
              aria-current={isActive(path) ? 'page' : undefined}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {showAddBook && <AddBookModal onClose={() => setShowAddBook(false)} />}
    </>
  )
}

export default Navbar
