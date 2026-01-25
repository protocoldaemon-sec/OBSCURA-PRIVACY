import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { navigation } from './navigation'

const validRoutes = [
  '/',
  '/vault/status',
  '/vault/deposit',
  '/vault/withdraw',
  '/vault/batches',
  '/vault/relayer',
  '/otc/quote-request',
  '/otc/quote',
  '/otc/accept',
  '/otc/messages',
  '/otc/admin',
  '/reference/errors',
  '/reference/chains',
  '/reference/cryptography',
  '/reference/zk-compression',
  '/reference/llm-docs',
]

describe('Navigation Data', () => {
  /**
   * Property 1: Navigation Route Consistency
   * For any navigation item in the sidebar, clicking it SHALL navigate
   * to a valid route that renders the corresponding page component.
   * Validates: Requirements 3.3
   */
  it('should have all navigation items pointing to valid routes', () => {
    const allNavItems = navigation.flatMap((group) => group.items)
    
    for (const item of allNavItems) {
      expect(validRoutes).toContain(item.href)
    }
  })

  it('should have unique hrefs for all navigation items', () => {
    const allHrefs = navigation.flatMap((group) => group.items.map((item) => item.href))
    const uniqueHrefs = new Set(allHrefs)
    
    expect(uniqueHrefs.size).toBe(allHrefs.length)
  })

  it('should have non-empty titles for all items', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...navigation.flatMap((g) => g.items)),
        (item) => {
          return item.title.length > 0
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have valid icons for all groups', () => {
    const validIcons = ['book', 'code', 'file-text', 'activity', 'shield', 'eye-off', 'layers', 'send']
    
    for (const group of navigation) {
      expect(validIcons).toContain(group.icon)
    }
  })

  it('should have at least one item in each group', () => {
    for (const group of navigation) {
      expect(group.items.length).toBeGreaterThan(0)
    }
  })
})
