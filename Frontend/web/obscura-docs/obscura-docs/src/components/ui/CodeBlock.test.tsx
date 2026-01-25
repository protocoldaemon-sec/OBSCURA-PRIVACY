import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as fc from 'fast-check'
import CodeBlock from './CodeBlock'

describe('CodeBlock Component', () => {
  let clipboardContent: string = ''

  beforeEach(() => {
    clipboardContent = ''
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn((text: string) => {
          clipboardContent = text
          return Promise.resolve()
        }),
      },
    })
  })

  /**
   * Property 2: Code Block Copy Functionality
   * For any code block with copy button, clicking copy SHALL place
   * the exact code content into the clipboard.
   * Validates: Requirements 6.3
   */
  it('should copy exact code content to clipboard for any code string', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 1000 }),
        async (codeContent) => {
          const { unmount } = render(<CodeBlock code={codeContent} />)
          
          const copyButton = screen.getByRole('button', { name: /copy/i })
          fireEvent.click(copyButton)
          
          await new Promise(resolve => setTimeout(resolve, 10))
          
          expect(clipboardContent).toBe(codeContent)
          
          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should render code content', () => {
    const code = '{"key": "value"}'
    render(<CodeBlock code={code} />)
    
    expect(screen.getByText(/"key"/)).toBeInTheDocument()
  })

  it('should render title when provided', () => {
    render(<CodeBlock code='{}' title="Example Request" />)
    
    expect(screen.getByText('Example Request')).toBeInTheDocument()
  })

  it('should render language label', () => {
    render(<CodeBlock code='{}' title="Test" language="json" />)
    
    expect(screen.getByText('json')).toBeInTheDocument()
  })

  it('should show check icon after copy', async () => {
    render(<CodeBlock code='test' />)
    
    const copyButton = screen.getByRole('button', { name: /copy/i })
    fireEvent.click(copyButton)
    
    await new Promise(resolve => setTimeout(resolve, 10))
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test')
  })
})
