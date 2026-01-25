# Design Document: Obscura Documentation Frontend

## Overview

Frontend dokumentasi Obscura dibangun menggunakan React TypeScript dengan Vite sebagai build tool dan Tailwind CSS untuk styling. Aplikasi menggunakan arsitektur component-based dengan routing berbasis file structure. Design mengikuti gaya Mintlify dengan dark theme, sidebar navigation, dan komponen dokumentasi interaktif.

## Architecture

```
obscura-docs/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── ui/
│   │   │   ├── CodeBlock.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Accordion.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Badge.tsx
│   │   └── docs/
│   │       ├── EndpointHeader.tsx
│   │       ├── RequestBody.tsx
│   │       └── ResponseExample.tsx
│   ├── pages/
│   │   ├── Overview.tsx
│   │   ├── endpoints/
│   │   │   ├── Transfer.tsx
│   │   │   ├── Deposit.tsx
│   │   │   ├── Swap.tsx
│   │   │   ├── Intents.tsx
│   │   │   ├── Batches.tsx
│   │   │   ├── Pools.tsx
│   │   │   └── Quotes.tsx
│   │   └── reference/
│   │       ├── ErrorCodes.tsx
│   │       ├── SupportedChains.tsx
│   │       └── Cryptography.tsx
│   ├── data/
│   │   └── navigation.ts
│   ├── hooks/
│   │   └── useSearch.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Components and Interfaces

### Layout Components

#### Header Component
```typescript
interface HeaderProps {
  onMenuClick: () => void;
  isMobileMenuOpen: boolean;
}

// Displays logo, search input, and mobile menu button
// Fixed position at top of viewport
```

#### Sidebar Component
```typescript
interface NavItem {
  title: string;
  href: string;
  icon?: string;
}

interface NavGroup {
  title: string;
  icon: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

interface SidebarProps {
  navigation: NavGroup[];
  isOpen: boolean;
  onClose: () => void;
}

// Renders navigation groups with collapsible sections
// Highlights active route
// Responsive: overlay on mobile, fixed on desktop
```

#### Layout Component
```typescript
interface LayoutProps {
  children: React.ReactNode;
}

// Wraps Header, Sidebar, and main content area
// Manages mobile menu state
```

### UI Components

#### CodeBlock Component
```typescript
interface CodeBlockProps {
  code: string;
  language: 'json' | 'bash' | 'typescript';
  title?: string;
  showLineNumbers?: boolean;
}

// Renders syntax-highlighted code
// Copy to clipboard functionality
// Dark theme styling
```

#### Card Component
```typescript
interface CardProps {
  title: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
}

// Clickable card with hover effect
// Links to internal pages
```

#### Accordion Component
```typescript
interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

// Expandable/collapsible content section
// Animated expand/collapse
```

#### Table Component
```typescript
interface TableColumn {
  key: string;
  header: string;
  width?: string;
}

interface TableProps {
  columns: TableColumn[];
  data: Record<string, string | number>[];
}

// Styled table with header and alternating rows
// Horizontal scroll on mobile
```

#### Badge Component
```typescript
interface BadgeProps {
  variant: 'get' | 'post' | 'put' | 'delete' | 'required' | 'optional';
  children: React.ReactNode;
}

// HTTP method badges and field requirement indicators
```

### Documentation Components

#### EndpointHeader Component
```typescript
interface EndpointHeaderProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
}

// Displays HTTP method badge and endpoint path
```

#### RequestBody Component
```typescript
interface FieldSchema {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface RequestBodyProps {
  fields: FieldSchema[];
}

// Renders request body schema as table
```

#### ResponseExample Component
```typescript
interface ResponseExampleProps {
  status: number;
  statusText: string;
  body: object;
}

// Renders response with status and JSON body
```

## Data Models

### Navigation Data
```typescript
const navigation: NavGroup[] = [
  {
    title: 'Getting Started',
    icon: 'book',
    items: [
      { title: 'Overview', href: '/' },
      { title: 'Quick Start', href: '/quickstart' }
    ],
    defaultOpen: true
  },
  {
    title: 'Endpoints',
    icon: 'code',
    items: [
      { title: 'Transfer', href: '/endpoints/transfer' },
      { title: 'Deposit', href: '/endpoints/deposit' },
      { title: 'Swap', href: '/endpoints/swap' },
      { title: 'Intents', href: '/endpoints/intents' },
      { title: 'Batches', href: '/endpoints/batches' },
      { title: 'Pools', href: '/endpoints/pools' },
      { title: 'Quotes', href: '/endpoints/quotes' }
    ]
  },
  {
    title: 'Reference',
    icon: 'file-text',
    items: [
      { title: 'Error Codes', href: '/reference/errors' },
      { title: 'Supported Chains', href: '/reference/chains' },
      { title: 'Cryptography', href: '/reference/cryptography' }
    ]
  }
];
```

### Endpoint Data Structure
```typescript
interface EndpointData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  requestBody?: {
    fields: FieldSchema[];
    example: object;
  };
  responses: {
    success: ResponseExampleProps;
    error: ResponseExampleProps;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation Route Consistency
*For any* navigation item in the sidebar, clicking it SHALL navigate to a valid route that renders the corresponding page component.
**Validates: Requirements 3.3**

### Property 2: Code Block Copy Functionality
*For any* code block with copy button, clicking copy SHALL place the exact code content into the clipboard.
**Validates: Requirements 6.3**

### Property 3: Accordion State Toggle
*For any* accordion component, clicking it SHALL toggle between expanded and collapsed states.
**Validates: Requirements 8.2, 8.3**

### Property 4: Search Filter Accuracy
*For any* search query, the filtered navigation items SHALL contain only items whose title includes the search term (case-insensitive).
**Validates: Requirements 10.2**

### Property 5: Responsive Layout Breakpoint
*For any* viewport width less than 768px, the sidebar SHALL be hidden and mobile menu button SHALL be visible.
**Validates: Requirements 2.4**

### Property 6: Active Navigation Highlight
*For any* current route, exactly one navigation item SHALL be highlighted as active, matching the current URL path.
**Validates: Requirements 3.4**

## Error Handling

### Navigation Errors
- Invalid routes display 404 page with link to overview
- Broken internal links logged to console in development

### Clipboard Errors
- If clipboard API unavailable, show fallback "Select and copy" message
- Display toast notification on copy success/failure

### Search Errors
- Empty search results display "No results found" message
- Search input debounced to prevent excessive filtering

## Testing Strategy

### Unit Tests
- Test individual component rendering
- Test component props and state changes
- Test utility functions (search filtering, route matching)

### Property-Based Tests
- Navigation consistency: generate random navigation structures and verify all routes resolve
- Search filtering: generate random search terms and verify filter accuracy
- Accordion toggle: verify state alternates correctly across multiple clicks

### Integration Tests
- Test full page navigation flow
- Test search to navigation flow
- Test mobile menu open/close flow

### Testing Framework
- Vitest for unit and property tests
- fast-check for property-based testing
- React Testing Library for component tests
