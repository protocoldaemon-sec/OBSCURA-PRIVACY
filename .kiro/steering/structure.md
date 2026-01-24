---
inclusion: always
---

# Project Structure

## Repository Organization

```
OBSCURA-PRIVACY/
├── Backend/
│   ├── Compliance/          # Address screening & compliance
│   ├── darkAgent/           # Solana agent kit (external dependency)
│   ├── darkOTC/             # Dark OTC RFQ backend (TypeScript)
│   ├── darkPool/            # Dark pool trading backend (Node.js + Rust)
│   ├── darkSwap&Bridge/     # Cross-chain swap & bridge (Node.js)
│   ├── darkTransfer/        # (Placeholder)
│   └── zk-elgamal-proof/    # ZK proof library (external dependency)
├── Frontend/
│   ├── mobile-app/
│   │   └── obscura-dapp/    # React Native Expo mobile app
│   └── web/
│       └── obscura/         # Next.js web application
└── .kiro/
    └── steering/            # AI assistant steering rules
```

## Backend Service Patterns

Each backend service follows a consistent structure:

```
Backend/{service}/
├── src/
│   ├── config/              # Configuration management
│   ├── middleware/          # Express middleware (auth, error handling)
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic layer
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── index.ts|server.js   # Application entry point
├── docs/                    # Service-specific documentation
├── test/                    # Test files
├── .env.example             # Environment variable template
├── package.json
└── README.md
```

## Dark OTC Backend (Primary Service)

```
Backend/darkOTC/
├── src/
│   ├── clients/             # External API clients (Obscura-LLMS)
│   ├── config/              # Solana, EVM, Supabase config
│   ├── middleware/          # Admin auth, signature verification, validation
│   ├── routes/              # RFQ, admin, privacy, blockchain routes
│   ├── services/            # RFQ, balance, privacy, settlement, signature, whitelist
│   ├── types/               # API, privacy, quote, message, whitelist types
│   └── utils/               # Error helpers, relayer fees
├── supabase/
│   └── migrations/          # Database schema migrations
├── test/                    # Integration test scripts
└── docs/                    # Requirements, guides, API docs
```

## Dark Pool Backend

```
Backend/darkPool/
├── src/
│   ├── config/              # Arcium, orderbook, matching config
│   ├── middleware/          # Auth, error handling
│   ├── routes/              # Orders, market data routes
│   ├── services/            # Arcium client, matching engine, orderbook
│   └── utils/               # Logger, Solana utilities
├── programs/
│   └── darkpool/            # Solana program (Rust)
├── encrypted-ixs/           # MPC circuits (Rust)
└── elusiv/                  # Privacy protocol integration
```

## Frontend Applications

### Web App Structure
```
Frontend/web/obscura/
├── app/                     # Next.js app directory
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── public/                  # Static assets
└── [config files]           # next.config.ts, tailwind, etc.
```

### Mobile App Structure
```
Frontend/mobile-app/obscura-dapp/
├── app/                     # Expo Router pages
├── components/              # Reusable React components
├── constants/               # App constants
├── hooks/                   # Custom React hooks
├── utils/                   # Utility functions
└── assets/                  # Images, fonts, etc.
```

## Key Architectural Patterns

### Backend Services
- **Layered Architecture**: Routes → Services → Clients/Utils
- **Middleware Chain**: Auth → Validation → Business Logic → Error Handling
- **Service Layer**: Encapsulates business logic, external API calls, blockchain interactions
- **Type Safety**: TypeScript interfaces for all data structures

### Database
- **Supabase**: PostgreSQL with Row Level Security
- **Migrations**: SQL files in `supabase/migrations/`
- **Tables**: quote_requests, quotes, messages, whitelist, used_signatures

### API Design
- **RESTful**: Standard HTTP methods (GET, POST, DELETE)
- **Versioned**: `/api/v1/` prefix
- **Response Format**: `{ success: boolean, data?: any, error?: string }`
- **Authentication**: WOTS+ signatures, API keys, admin verification

### Privacy Components
- **Stealth Addresses**: One-time addresses for unlinkability
- **Commitments**: Pedersen commitments for hiding amounts/prices
- **Signatures**: WOTS+ post-quantum one-time signatures (2208 bytes)
- **Nullifiers**: Prevent double-spending and replay attacks

## External Dependencies

- **darkAgent**: Solana agent kit (separate git repository)
- **zk-elgamal-proof**: ZK proof library (separate git repository)
- **elusiv**: Privacy protocol (submodule in darkPool)

## Documentation Locations

- **API Docs**: `Backend/{service}/docs/`
- **Requirements**: `Backend/darkOTC/docs/DARK_OTC_BACKEND_REQUIREMENTS.md`
- **Architecture**: `Backend/darkSwap&Bridge/docs/ARCHITECTURE.md`
- **Deployment**: `Backend/darkPool/docs/DEPLOYMENT.md`
- **Quickstart**: Each service has `README.md` or `QUICKSTART.md`
