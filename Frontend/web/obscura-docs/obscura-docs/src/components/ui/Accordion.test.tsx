import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as fc from 'fast-check'
import Accordion from './Accordion'

describe('Accordion Component', () => {
  /**
   * Property 3: Accordion State Toggle
   * For any accordion component, clicking it SHALL toggle between
   * expanded and collapsed states.
   * Validates: Requirements 8.2, 8.3
   */
  it('should toggle state on each click', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.nat({ max: 10 }),
        (title, content, clickCount) => {
          const { unmount } = render(
            <Accordion title={title}>
              <div data-testid="content">{content}</div>
            </Accordion>
          )

          const button = screen.getByRole('button')
          let expectedOpen = false

          for (let i = 0; i < clickCount; i++) {
            fireEvent.click(button)
            expectedOpen = !expectedOpen
          }

          expect(button.getAttribute('aria-expanded')).toBe(String(expectedOpen))

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should render title', () => {
    render(
      <Accordion title="Test Title">
        <div>Content</div>
      </Accordion>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('should start collapsed by default', () => {
    render(
      <Accordion title="Test">
        <div>Content</div>
      </Accordion>
    )

    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('should start expanded when defaultOpen is true', () => {
    render(
      <Accordion title="Test" defaultOpen>
        <div>Content</div>
      </Accordion>
    )

    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-expanded')).toBe('true')
  })

  it('should expand on click when collapsed', () => {
    render(
      <Accordion title="Test">
        <div>Content</div>
      </Accordion>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(button.getAttribute('aria-expanded')).toBe('true')
  })

  it('should collapse on click when expanded', () => {
    render(
      <Accordion title="Test" defaultOpen>
        <div>Content</div>
      </Accordion>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(button.getAttribute('aria-expanded')).toBe('false')
  })
})
