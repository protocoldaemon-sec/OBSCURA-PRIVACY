import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Book, Code, FileText, Circle, Clock, Calendar, Activity, Shield, EyeOff, Layers, Send } from 'lucide-react'

const API_BASE_URL = 'https://obscura-api.daemonprotocol.com'

export interface NavItem {
  title: string
  href: string
}

export interface NavGroup {
  title: string
  icon: string
  items: NavItem[]
  defaultOpen?: boolean
}

interface SidebarProps {
  navigation: NavGroup[]
  isOpen: boolean
  onClose: () => void
  searchQuery: string
}

const iconMap: Record<string, React.ReactNode> = {
  book: <Book className="w-4 h-4" />,
  code: <Code className="w-4 h-4" />,
  'file-text': <FileText className="w-4 h-4" />,
  activity: <Activity className="w-4 h-4" />,
  shield: <Shield className="w-4 h-4" />,
  'eye-off': <EyeOff className="w-4 h-4" />,
  layers: <Layers className="w-4 h-4" />,
  send: <Send className="w-4 h-4" />,
}

export default function Sidebar({ navigation, isOpen, onClose, searchQuery }: SidebarProps) {
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    navigation.forEach((group) => {
      initial[group.title] = group.defaultOpen ?? true
    })
    return initial
  })
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

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const filteredNavigation = navigation.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0)

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] z-40 transform transition-transform duration-200 lg:translate-x-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1 overflow-y-auto p-4">
          {filteredNavigation.map((group) => (
            <div key={group.title} className="mb-4">
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  {iconMap[group.icon]}
                  <span>{group.title}</span>
                </div>
                {openGroups[group.title] ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {openGroups[group.title] && (
                <ul className="mt-1 ml-2 space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={onClose}
                          className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                            isActive
                              ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-secondary)] border-l-2 border-[var(--accent-primary)]'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                          }`}
                        >
                          {item.title}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>

        <div className="lg:hidden p-4 border-t border-[var(--border-color)] space-y-3">
          <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--text-muted)]">
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
          
          <div className="flex flex-col items-center gap-1 text-xs text-[var(--text-muted)]">
            <span>A product by</span>
            <span className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-tertiary)] rounded">
              <img src="/adaptive-icon.png" alt="Daemon Blockint" className="w-4 rounded-sm" />
              <span className="text-[var(--text-secondary)]">Daemon Blockint Technologies</span>
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}
