import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import * as fc from 'fast-check'
import Sidebar from './Sidebar'
import { navigation } from '../../data/navigation'

const renderWithRouter = (ui: React.ReactElement, initialRoute: string = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {ui}
    </MemoryRouter>
  )
}

describe('Sidebar Component', () => {
  /**
   * Property 6: Active Navigation Highlight
   * For any current route, exactly one navigation item SHALL be highlighted
   * as active, matching the current URL path.
   * Validates: Requirements 3.4
   */
  it('should highlight exactly one navigation item for any valid route', () => {
    const allRoutes = navigation.flatMap((group) => group.items.map((item) => item.href))

    fc.assert(
      fc.property(
        fc.constantFrom(...allRoutes),
        (route) => {
          const { container, unmount } = renderWithRouter(
            <Sidebar
              navigation={navigation}
              isOpen={true}
              onClose={() => {}}
              searchQuery=""
            />,
            route
          )

          const activeLinks = container.querySelectorAll('a.border-l-2')
          
          expect(activeLinks.length).toBe(1)
          
          const activeLink = activeLinks[0] as HTMLAnchorElement
          expect(activeLink.getAttribute('href')).toBe(route)

          unmount()
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should render all navigation groups', () => {
    renderWithRouter(
      <Sidebar
        navigation={navigation}
        isOpen={true}
        onClose={() => {}}
        searchQuery=""
      />
    )

    for (const group of navigation) {
      expect(screen.getByText(group.title)).toBeInTheDocument()
    }
  })

  it('should render all navigation items', () => {
    renderWithRouter(
      <Sidebar
        navigation={navigation}
        isOpen={true}
        onClose={() => {}}
        searchQuery=""
      />
    )

    const allItems = navigation.flatMap((group) => group.items)
    for (const item of allItems) {
      expect(screen.getByText(item.title)).toBeInTheDocument()
    }
  })

  it('should filter items based on search query', () => {
    renderWithRouter(
      <Sidebar
        navigation={navigation}
        isOpen={true}
        onClose={() => {}}
        searchQuery="deposit"
      />
    )

    expect(screen.getByText('Deposit')).toBeInTheDocument()
    expect(screen.queryByText('Relayer Service')).not.toBeInTheDocument()
  })
})
