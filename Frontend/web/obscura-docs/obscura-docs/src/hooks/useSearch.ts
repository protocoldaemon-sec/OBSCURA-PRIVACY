import { useMemo } from 'react'
import type { NavGroup } from '../components/layout/Sidebar'

export interface SearchResult {
  title: string
  href: string
  group: string
}

export function useSearch(navigation: NavGroup[], query: string): SearchResult[] {
  return useMemo(() => {
    if (!query.trim()) {
      return []
    }

    const normalizedQuery = query.toLowerCase().trim()
    const results: SearchResult[] = []

    navigation.forEach((group) => {
      group.items.forEach((item) => {
        if (item.title.toLowerCase().includes(normalizedQuery)) {
          results.push({
            title: item.title,
            href: item.href,
            group: group.title,
          })
        }
      })
    })

    return results
  }, [navigation, query])
}

export function filterNavigation(navigation: NavGroup[], query: string): NavGroup[] {
  if (!query.trim()) {
    return navigation
  }

  const normalizedQuery = query.toLowerCase().trim()

  return navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.title.toLowerCase().includes(normalizedQuery)
      ),
    }))
    .filter((group) => group.items.length > 0)
}
