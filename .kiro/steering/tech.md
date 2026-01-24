---
inclusion: always
---

# Technology Stack

## Backend Services

### Dark OTC Backend
- **Runtime**: Node.js 18+, TypeScript 5.3+
- **Framework**: Express.js 4.18+
- **Database**: Supabase (PostgreSQL 15+)
- **Blockchain**: @solana/web3.js 1.95.8, ethers.js 6.13+
- **Privacy**: Arcium SDK 0.6.3, Light Protocol 0.22.1-alpha.1, mochimo-wots-v2 1.1.1
- **Testing**: Jest 29.7+

### Dark Pool Backend
- **Runtime**: Node.js 18+, Rust
- **Framework**: Express.js
- **Storage**: Redis (order book)
- **Blockchain**: Solana CLI, Arcium CLI
- **MPC**: Arcium Multi-Party Computation

### Dark Swap & Bridge Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **SDK**: @silentswap/sdk 0.0.53
- **Blockchain**: viem 2.7+, @solana/web3.js 1.87.6

### Compliance Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **API**: Range API for address screening

## Frontend Applications

### Web App
- **Framework**: Next.js 16.0.10, React 19.2.3
- **Styling**: Tailwind CSS 4
- **Blockchain**: @solana/client 1.2.0, @solana/react-hooks 1.1.5
- **Language**: TypeScript 5

### Mobile App
- **Framework**: Expo 54.0.21, React Native 0.81.5
- **Navigation**: Expo Router 6.0.10
- **Blockchain**: @solana/web3.js 1.98.4, @wallet-ui/react-native-web3js 3.0.0
- **State**: @tanstack/react-query 5.85.5

## Common Commands

### Dark OTC Backend
```bash
npm run dev          # Development with hot reload
npm run build        # Build TypeScript
npm start            # Production server
npm test             # Run Jest tests
npm run setup-db     # Setup Supabase database
npm run verify-db    # Verify database schema
```

### Dark Pool Backend
```bash
npm install          # Install dependencies
npm run build        # Build Arcium program
npm run deploy:devnet # Deploy to Solana devnet
npm run init:comp-defs # Initialize computation definitions
npm start            # Start server
node test-api.js     # Run API tests
```

### Dark Swap & Bridge Backend
```bash
npm start            # Start server
npm run dev          # Development with auto-reload
node test-api.js     # Test API endpoints
```

### Frontend Web
```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Start production server
npm run lint         # Lint code
npm run format       # Format with Prettier
```

### Frontend Mobile
```bash
npm run dev          # Start Expo dev server
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run build        # Build for production
npm run lint         # Lint code
npm run fmt          # Format with Prettier
```

## Development Tools

- **Package Manager**: npm
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript
- **Testing**: Jest (backend), React Testing (frontend)
- **Containerization**: Docker, docker-compose
