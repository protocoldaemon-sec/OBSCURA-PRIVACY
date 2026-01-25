import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { filterNavigation } from './useSearch'
import type { NavGroup } from '../components/layout/Sidebar'

const navGroupArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 50 }),
  icon: fc.constantFrom('book', 'code', 'file-text'),
  items: fc.array(
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 50 }),
      href: fc.string({ minLength: 1, maxLength: 100 }),
    }),
    { minLength: 1, maxLength: 10 }
  ),
  defaultOpen: fc.boolean(),
})

const navigationArb = fc.array(navGroupArb, { minLength: 1, maxLength: 5 })

describe('Search Filtering', () => {
  /**
   * Property 4: Search Filter Accuracy
   * For any search query, the filtered navigation items SHALL contain
   * only items whose title includes the search term (case-insensitive).
   * Validates: Requirements 10.2
   */
  it('should only return items containing the search term (case-insensitive)', () => {
    fc.assert(
      fc.property(
        navigationArb,
        fc.string({ minLength: 1, maxLength: 20 }),
        (navigation, query) => {
          const filtered = filterNavigation(navigation as NavGroup[], query)
          
          const normalizedQuery = query.toLowerCase().trim()
          
          if (!normalizedQuery) {
            return true
          }

          for (const group of filtered) {
            for (const item of group.items) {
              const matches = item.title.toLowerCase().includes(normalizedQuery)
              if (!matches) {
                return false
              }
            }
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all navigation when query is empty', () => {
    fc.assert(
      fc.property(navigationArb, (navigation) => {
        const filtered = filterNavigation(navigation as NavGroup[], '')
        return filtered.length === navigation.length
      }),
      { numRuns: 100 }
    )
  })

  it('should return empty when no matches found', () => {
    const navigation: NavGroup[] = [
      {
        title: 'Test',
        icon: 'book',
        items: [{ title: 'Hello', href: '/hello' }],
      },
    ]

    const filtered = filterNavigation(navigation, 'xyz123notfound')
    expect(filtered).toHaveLength(0)
  })

  it('should be case-insensitive', () => {
    const navigation: NavGroup[] = [
      {
        title: 'Test',
        icon: 'book',
        items: [{ title: 'Transfer', href: '/transfer' }],
      },
    ]

    const filtered1 = filterNavigation(navigation, 'transfer')
    const filtered2 = filterNavigation(navigation, 'TRANSFER')
    const filtered3 = filterNavigation(navigation, 'TrAnSfEr')

    expect(filtered1).toHaveLength(1)
    expect(filtered2).toHaveLength(1)
    expect(filtered3).toHaveLength(1)
  })

  it('should filter across multiple groups', () => {
    const navigation: NavGroup[] = [
      {
        title: 'Group1',
        icon: 'book',
        items: [
          { title: 'Transfer', href: '/transfer' },
          { title: 'Deposit', href: '/deposit' },
        ],
      },
      {
        title: 'Group2',
        icon: 'code',
        items: [
          { title: 'Swap', href: '/swap' },
          { title: 'Transfer Fee', href: '/transfer-fee' },
        ],
      },
    ]

    const filtered = filterNavigation(navigation, 'transfer')
    
    const allItems = filtered.flatMap((g) => g.items)
    expect(allItems).toHaveLength(2)
    expect(allItems.every((item) => item.title.toLowerCase().includes('transfer'))).toBe(true)
  })
})
