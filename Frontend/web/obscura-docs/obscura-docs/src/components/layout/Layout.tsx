import { useState, type ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { navigation } from '../../data/navigation'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header
        onMenuClick={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <Sidebar
        navigation={navigation}
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        searchQuery={searchQuery}
      />
      
      <main className="pt-16 lg:pl-64">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
