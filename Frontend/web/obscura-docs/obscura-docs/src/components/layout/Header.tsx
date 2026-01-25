import { useState, useEffect } from 'react'
import { Menu, Search, X, Circle, Clock, Calendar } from 'lucide-react'

const API_BASE_URL = 'https://obscura-api.daemonprotocol.com'

interface HeaderProps {
  onMenuClick: () => void
  isMobileMenuOpen: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function Header({ 
  onMenuClick, 
  isMobileMenuOpen,
  searchQuery,
  onSearchChange 
}: HeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [beStatus, setBeStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        })
        setBeStatus(response.ok ? 'online' : 'offline')
      } catch {
        setBeStatus('offline')
      }
    }

    checkBackendStatus()
    const statusInterval = setInterval(checkBackendStatus, 30000)

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      clearInterval(statusInterval)
      clearInterval(timeInterval)
    }
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const getStatusColor = () => {
    switch (beStatus) {
      case 'online': return 'text-green-500'
      case 'offline': return 'text-red-500'
      default: return 'text-yellow-500'
    }
  }

  const getStatusText = () => {
    switch (beStatus) {
      case 'online': return 'Online'
      case 'offline': return 'Offline'
      default: return 'Checking...'
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            ) : (
              <Menu className="w-5 h-5 text-[var(--text-secondary)]" />
            )}
          </button>
          
          <a href="/" className="flex items-center gap-3">
            <img 
              src="/logo-white-with-text.png" 
              alt="Obscura" 
              className="h-8"
            />
            <span className="px-2 py-0.5 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-tertiary)] rounded-full">
              Docs
            </span>
          </a>
          <span className="hidden lg:flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            A product by
            <span className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-tertiary)] rounded">
              <img src="/adaptive-icon.png" alt="Daemon Blockint" className="w-4 rounded-sm" />
              <span className="text-[var(--text-secondary)]">Daemon Blockint Technologies</span>
            </span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-tertiary)] rounded-lg">
              <Circle className={`w-2 h-2 fill-current ${getStatusColor()}`} />
              <span>BE: {getStatusText()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-tertiary)] rounded-lg">
              <Clock className="w-3 h-3" />
              <span>{formatTime(currentTime)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-tertiary)] rounded-lg">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(currentTime)}</span>
            </div>
          </div>

          <div className={`relative transition-all duration-200 ${isSearchFocused ? 'w-48' : 'w-36'}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
