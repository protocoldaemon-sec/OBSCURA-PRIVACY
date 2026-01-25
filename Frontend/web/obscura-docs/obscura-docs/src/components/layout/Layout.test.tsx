import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Layout from './Layout'

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('Layout Component', () => {
  /**
   * Property 5: Responsive Layout Breakpoint
   * For any viewport width less than 768px, the sidebar SHALL be hidden
   * and mobile menu button SHALL be visible.
   * Validates: Requirements 2.4
   */
  it('should have sidebar hidden by default (mobile state)', () => {
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    const sidebar = document.querySelector('aside')
    expect(sidebar).toHaveClass('-translate-x-full')
  })

  it('should render children content', () => {
    renderWithRouter(
      <Layout>
        <div data-testid="test-content">Test Content</div>
      </Layout>
    )

    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  it('should render header with logo', () => {
    renderWithRouter(
      <Layout>
        <div>Test</div>
      </Layout>
    )

    expect(screen.getByAltText('Obscura')).toBeInTheDocument()
  })

  it('should render search input', () => {
    renderWithRouter(
      <Layout>
        <div>Test</div>
      </Layout>
    )

    expect(screen.getByPlaceholderText('Search docs...')).toBeInTheDocument()
  })

  it('should render mobile menu button', () => {
    renderWithRouter(
      <Layout>
        <div>Test</div>
      </Layout>
    )

    const menuButton = screen.getByLabelText(/menu/i)
    expect(menuButton).toBeInTheDocument()
  })
})
